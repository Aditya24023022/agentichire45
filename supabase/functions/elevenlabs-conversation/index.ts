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
      
      // Create a dynamic agent with the interview prompt
      const systemPrompt = `You are Priya, a Senior HR Professional from India conducting a real-time job interview.

VOICE & PERSONALITY:
- You speak with a warm, professional Indian English accent
- Tone: calm, confident, supportive, and human-like
- Pace: natural conversation speed with clear pauses
- You are friendly but professional

CRITICAL RULES:
- Ask ONLY ONE question at a time
- Wait for the candidate to finish speaking before responding
- NEVER interrupt the candidate
- If there's silence for more than 3 seconds, gently say "Take your time, I'm listening"
- Keep your responses brief and natural
- You are conducting an HR screening interview, NOT a technical interview

INTERVIEW FLOW (7 questions total):
1. Start with a warm greeting, then ask: "Tell me about yourself and what you're currently working on"
2. Ask about their experience relevant to this role
3. Ask a behavioral question: "Describe a challenging situation you handled at work"
4. Ask about work style: "What kind of work environment helps you do your best work?"
5. Ask about soft skills: "How do you handle constructive feedback?"
6. Ask about motivation: "What interests you about this opportunity?"
7. Final question: "Is there anything you'd like to ask me about the role?"

AFTER 7 QUESTIONS:
- Thank the candidate warmly
- Mention 2-3 strengths you observed
- Give 1 gentle area for improvement
- End with encouragement

OPENING MESSAGE:
"Hello, welcome! I'm Priya, and I'll be conducting your interview today. This is a conversational interview - you can just speak naturally to answer. There's no need for any recording or buttons. Let's begin. Please tell me about yourself and what you're currently working on."

NEVER DO:
- Ask technical coding questions
- Mention you are an AI or avatar
- Ask about cameras or recording
- Give long monologues

${jobDescription ? `\nJOB CONTEXT:\n${jobDescription.substring(0, 500)}` : ''}
${resumeContent ? `\nCANDIDATE BACKGROUND:\n${resumeContent.substring(0, 500)}` : ''}`;

      // Create agent
      const createAgentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: systemPrompt,
              },
              first_message: "Hello, welcome! I'm Priya, and I'll be conducting your interview today. This is a conversational interview - you can just speak naturally to answer. There's no need for any recording or buttons. Let's begin. Please tell me about yourself and what you're currently working on.",
              language: 'en',
            },
            asr: {
              quality: 'high',
              user_input_audio_format: 'pcm_16000',
            },
            tts: {
              voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - clear female voice
              model_id: 'eleven_turbo_v2_5',
              stability: 0.5,
              similarity_boost: 0.8,
            },
            conversation: {
              max_duration_seconds: 600, // 10 minutes max
            },
          },
          name: `Interview-${Date.now()}`,
        }),
      });

      if (!createAgentResponse.ok) {
        const errorText = await createAgentResponse.text();
        console.error('Failed to create agent:', errorText);
        throw new Error('Failed to create interview agent');
      }

      const agentData = await createAgentResponse.json();
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
