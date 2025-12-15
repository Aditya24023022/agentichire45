import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { action, jobDescription, resumeContent } = await req.json();

    if (action === 'get-token') {
      console.log('Creating ElevenLabs conversation agent...');
      
      // Clean and truncate the job description and resume to avoid API limits
      const cleanJobDesc = (jobDescription || '').replace(/!\[.*?\]\(.*?\)/g, '').substring(0, 800);
      const cleanResume = (resumeContent || '').substring(0, 800);
      
      const systemPrompt = `You are Priya, a Senior HR Professional from India conducting a real-time job interview.

VOICE & PERSONALITY:
- Speak with a warm, professional Indian English accent
- Tone: calm, confident, supportive, human-like
- Pace: natural conversation speed with clear pauses

CRITICAL RULES:
- Ask ONLY ONE question at a time
- Wait for the candidate to finish speaking
- NEVER interrupt
- Keep responses brief and natural
- HR screening interview only - NO technical questions

INTERVIEW FLOW (7 questions):
1. "Tell me about yourself"
2. Ask about relevant experience
3. "Describe a challenging situation you handled"
4. "What work environment helps you thrive?"
5. "How do you handle feedback?"
6. "What interests you about this role?"
7. "Any questions for me?"

AFTER 7 QUESTIONS:
- Thank the candidate
- Share 2-3 strengths observed
- Give 1 improvement area kindly
- End with encouragement

NEVER:
- Ask technical coding questions
- Mention AI or avatar
- Ask about cameras or recording

JOB CONTEXT: ${cleanJobDesc}

CANDIDATE: ${cleanResume}`;

      // Create agent with correct API format
      const createAgentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Interview-${Date.now()}`,
          conversation_config: {
            agent: {
              prompt: {
                prompt: systemPrompt,
                llm: 'gemini-1.5-flash',
                temperature: 0.7,
              },
              first_message: "Hello, welcome! I'm Priya, and I'll be conducting your interview today. This is a conversational interview - just speak naturally to answer. No recording or buttons needed. Let's begin. Please tell me about yourself.",
              language: 'en',
            },
            tts: {
              voice_id: 'EXAVITQu4vr4xnSDxMaL',
            },
          },
        }),
      });

      const responseText = await createAgentResponse.text();
      console.log('Create agent response:', createAgentResponse.status, responseText);

      if (!createAgentResponse.ok) {
        console.error('Failed to create agent:', responseText);
        throw new Error(`Failed to create interview agent: ${responseText}`);
      }

      const agentData = JSON.parse(responseText);
      console.log('Created agent:', agentData.agent_id);

      // Get signed URL for WebSocket connection
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentData.agent_id}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('Failed to get signed URL:', errorText);
        throw new Error('Failed to start interview session');
      }

      const urlData = await signedUrlResponse.json();
      console.log('Got signed URL successfully');

      return new Response(JSON.stringify(urlData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
