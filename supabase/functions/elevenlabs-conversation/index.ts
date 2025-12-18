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
      
      // Generate unique session ID for question variation
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      const questionVariation = Math.floor(Math.random() * 100);
      
      // Clean and truncate the job description and resume to avoid API limits
      const cleanJobDesc = (jobDescription || '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1500);
      const cleanResume = (resumeContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1500);

      const isHR = interviewType === 'hr';

      // Random question focus areas for variety
      const hrFocusAreas = [
        'motivation and career aspirations',
        'teamwork and collaboration experiences',
        'handling challenges and setbacks',
        'leadership and initiative examples',
        'communication and stakeholder management',
        'adaptability and learning new things',
        'conflict resolution and feedback handling'
      ];
      
      const techFocusAreas = [
        'system architecture and design patterns',
        'debugging and troubleshooting approaches',
        'code quality and best practices',
        'performance optimization techniques',
        'testing strategies and methodologies',
        'security considerations',
        'scalability and reliability'
      ];
      
      // Shuffle and pick random focus areas for this session
      const shuffledHR = hrFocusAreas.sort(() => Math.random() - 0.5).slice(0, 4);
      const shuffledTech = techFocusAreas.sort(() => Math.random() - 0.5).slice(0, 4);

      const hrPrompt = `You are Priya, an experienced Indian HR Professional conducting a screening interview.
Session ID: ${sessionId} (use this to ensure unique questions)

CRITICAL RULES:
- Ask ONE question at a time, then WAIT for the candidate to respond
- Keep your responses SHORT (1-2 sentences max)
- NO technical questions - this is HR screening only
- EVERY question must reference something specific from the JOB or RESUME below
- Ask EXACTLY 7 questions total (different each session)

FOCUS AREAS FOR THIS SESSION (randomized): ${shuffledHR.join(', ')}

QUESTION TYPES TO INCLUDE:
- "Tell me about a time when..." (behavioral/STAR)
- "Why are you interested in this role/company?"
- "How would you handle..." (situational)
- "I noticed on your resume you worked on X, tell me more..."
- "What kind of work environment do you prefer?"
- "Where do you see yourself in 3-5 years?"

AFTER 7TH ANSWER:
- Thank the candidate warmly
- Give 2 specific strengths you observed
- Give 1 area they could improve
- Say: "You can now click End Interview to see your detailed report."

JOB DESCRIPTION:
${cleanJobDesc}

CANDIDATE RESUME:
${cleanResume}

Remember: Be warm, professional, and speak naturally like a real Indian HR professional. Variation seed: ${questionVariation}`;

      const technicalPrompt = `You are Arjun, a Senior Technical Lead from India conducting a technical interview.
Session ID: ${sessionId} (use this to ensure unique questions)

CRITICAL RULES:
- Ask ONE question at a time, then WAIT for response
- Keep your questions CLEAR and CONCISE
- Questions MUST be specific to tech stack mentioned in JD and resume
- Probe deeper when answers are vague or incorrect
- Ask EXACTLY 7 questions total (different each session)

FOCUS AREAS FOR THIS SESSION (randomized): ${shuffledTech.join(', ')}

QUESTION TYPES TO INCLUDE:
- Deep dive on a specific project from resume
- Core concept questions (explain how X works)
- Practical scenario (how would you implement/debug X)
- System design question appropriate to seniority
- Best practices (testing, security, code review)
- Problem-solving approach question

AFTER 7TH ANSWER:
- Thank the candidate
- Mention 2 technical strengths demonstrated
- Mention 1 technical gap or area to improve
- Say: "You can now click End Interview to see your detailed technical assessment."

JOB REQUIREMENTS:
${cleanJobDesc}

CANDIDATE RESUME:
${cleanResume}

Remember: Be direct but friendly, like a senior Indian tech lead. Variation seed: ${questionVariation}`;

      const systemPrompt = isHR ? hrPrompt : technicalPrompt;
      
      // Different opening questions for variety
      const hrOpenings = [
        "Namaste! I'm Priya, and I'll be conducting your HR interview today. Let's start - tell me about your professional journey so far.",
        "Hello! I'm Priya from HR. Thanks for joining today. Can you walk me through your background and what brought you here?",
        "Hi there! I'm Priya, your interviewer. Let's begin - what excites you most about this opportunity?"
      ];
      
      const techOpenings = [
        "Hi! I'm Arjun, the technical interviewer. Let's dive in - can you tell me about a challenging technical project you've worked on?",
        "Hello! I'm Arjun. Let's start with your technical background - what technologies are you most proficient in?",
        "Hi there! I'm Arjun from the engineering team. Tell me about a system you designed or significantly contributed to."
      ];
      
      const firstMessage = isHR 
        ? hrOpenings[Math.floor(Math.random() * hrOpenings.length)]
        : techOpenings[Math.floor(Math.random() * techOpenings.length)];
      
      // Using voices that work well with Indian English persona
      // Jessica (female) and Eric (male) have natural tones that fit professional Indian personas
      // The persona is defined through the prompt to speak as Indian HR/Tech professionals
      const voiceId = isHR ? 'cgSgspJ2msm6clMCkdW9' : 'cjVigY5qzO86Huf0OWal';

      // Create agent with correct format
      const createAgentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Interview-${sessionId}`,
          conversation_config: {
            agent: {
              prompt: {
                prompt: systemPrompt,
                llm: 'gpt-4o-mini',
                temperature: 0.8, // Higher temperature for more variety
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
