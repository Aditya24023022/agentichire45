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

    const { action, jobDescription, resumeContent, interviewType = 'hr' } = await req.json();

    if (action === 'get-token') {
      console.log(`Creating ElevenLabs ${interviewType} interview agent...`);
      
      // Clean and truncate the job description and resume to avoid API limits
      const cleanJobDesc = (jobDescription || '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1200);
      const cleanResume = (resumeContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1200);

      const isHR = interviewType === 'hr';

      const hrPrompt = `You are Priya, an HR Professional conducting a screening interview.

GOAL:
- Ask 7 HR questions that are PERSONALIZED to the JOB + CANDIDATE.
- Every interview session must feel different (vary wording + angle).

STRICT RULES:
- Ask ONE question at a time, then WAIT.
- Keep your own messages short (1-2 sentences).
- NO technical questions.
- Questions must reference the job description OR something from the resume.
- Avoid generic templates like "Tell me about yourself" unless you tie it to their background.

QUESTION AREAS (pick 7, all different):
- Motivation for this role/company
- Relevant experience verification (from resume)
- Behavioral (STAR)
- Conflict/feedback handling
- Ownership/initiative
- Collaboration/culture fit
- Career goals + why now

After the 7th answer:
- Thank them.
- Give 2 strengths + 1 improvement area.
- End with: "You can now press End Interview to view your report." 

JOB DESCRIPTION: ${cleanJobDesc}
CANDIDATE RESUME: ${cleanResume}`;

      const technicalPrompt = `You are Arjun, a Senior Technical Lead conducting a technical interview.

GOAL:
- Ask 7 TECHNICAL questions that are PERSONALIZED to the JOB + CANDIDATE.
- Every interview session must feel different (vary wording + topic selection).

STRICT RULES:
- Ask ONE question at a time, then WAIT.
- Keep your own messages short (1-2 sentences).
- Questions MUST be based on tech stack/requirements in the job description and skills/projects in the resume.
- If the resume/JD mentions AWS/Lambda/S3, ask AWS-specific questions; if React, ask React; etc.
- Probe deeper when answers are vague.

QUESTION AREAS (pick 7, all different):
- Deep dive on a resume project/experience
- Core concepts in the stack
- Practical debugging/troubleshooting scenario
- System design scenario matched to role seniority
- Performance/scaling tradeoffs
- Testing/quality/security best practices
- Role-specific problem-solving

After the 7th answer:
- Thank them.
- Provide 2 technical strengths + 1 gap.
- End with: "You can now press End Interview to view your report." 

JOB REQUIREMENTS: ${cleanJobDesc}
CANDIDATE RESUME: ${cleanResume}`;

      const systemPrompt = isHR ? hrPrompt : technicalPrompt;
      
      const hrFirstMessage = "Hello! I'm Priya, your HR interviewer today. Just speak naturally - no buttons needed. Let's begin. Tell me about yourself.";
      const technicalFirstMessage = "Hi there! I'm Arjun, and I'll be conducting your technical interview today. Just speak naturally. Let's start - can you walk me through your technical background?";
      
      const firstMessage = isHR ? hrFirstMessage : technicalFirstMessage;
      
      // Use different voices for HR vs Technical
      const voiceId = isHR ? 'EXAVITQu4vr4xnSDxMaL' : 'N2lVS1w4EtoT3dr4eOWO'; // Sarah for HR, Callum for Technical

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
              model_id: 'eleven_turbo_v2',
              voice_id: voiceId,
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
