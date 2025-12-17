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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, userProfile } = await req.json();

    const systemPrompt = `You are an expert Career Counselor AI assistant. Your ONLY role is to help users with career-related topics.

🎯 YOUR SCOPE (ONLY respond to these topics):
- Career path discovery and guidance
- Skill development and learning roadmaps  
- Job search strategies and tips
- Resume and interview preparation
- Industry insights and job market trends
- Professional networking advice
- Salary negotiation guidance
- Career transitions
- Work-life balance in professional contexts

🚫 OFF-TOPIC RULES:
If someone asks about ANYTHING not career-related (cooking, weather, health, relationships, entertainment, etc.), respond with:
"I'm your dedicated Career Counselor, so I can only assist with career-related questions! How can I help with your professional journey today?"

📋 RESPONSE FORMAT:
- Keep responses SHORT and STRUCTURED
- Use bullet points for lists
- Highlight key action items with ✅
- Use emojis sparingly for visual appeal
- Break complex advice into numbered steps
- Provide specific, actionable recommendations
- Include timeframes when suggesting learning paths

${userProfile ? `
👤 USER PROFILE CONTEXT:
${userProfile}

Use this profile information to personalize your advice. Reference their specific skills, experience, and goals when relevant.
` : ''}

Start conversations warmly but stay focused on career guidance.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
