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
      console.log('Creating ElevenLabs conversation agent v3...');
      
      // Clean and truncate the job description and resume to avoid API limits
      const cleanJobDesc = (jobDescription || '').replace(/!\[.*?\]\(.*?\)/g, '').substring(0, 600);
      const cleanResume = (resumeContent || '').substring(0, 600);
      
      const systemPrompt = `You are Priya, an HR Professional conducting an interview.

RULES:
- Ask ONE question at a time
- Wait for response before next question
- Keep responses brief
- NO technical questions - HR only

QUESTIONS (7 total):
1. Tell me about yourself
2. Your relevant experience
3. A challenging work situation
4. Ideal work environment
5. How you handle feedback
6. Why this role interests you
7. Questions for me?

After 7 questions: Thank them, share 2 strengths, 1 improvement area.

JOB: ${cleanJobDesc}
CANDIDATE: ${cleanResume}`;

      const firstMessage = "Hello! I'm Priya, your interviewer today. Just speak naturally - no buttons needed. Let's begin. Tell me about yourself.";

      // Create agent with correct format for English agents
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
                llm: 'gpt-4o-mini', // Using OpenAI model which is well supported
                temperature: 0.7,
              },
              first_message: firstMessage,
              language: 'en',
            },
            tts: {
              model_id: 'eleven_turbo_v2', // Using turbo v2 as required for English
              voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
            },
          },
        }),
      });

      const responseText = await createAgentResponse.text();
      console.log('Create agent response status:', createAgentResponse.status);
      console.log('Create agent response:', responseText.substring(0, 500));

      if (!createAgentResponse.ok) {
        console.error('Failed to create agent:', responseText);
        throw new Error(`Agent creation failed: ${createAgentResponse.status}`);
      }

      const agentData = JSON.parse(responseText);
      console.log('Created agent with ID:', agentData.agent_id);

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
