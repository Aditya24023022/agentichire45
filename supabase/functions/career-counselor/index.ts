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

    const systemPrompt = `You are a CONCISE Career Counselor AI specialized in tech, data science, engineering, and all career domains.

✅ VALID CAREER TOPICS (answer these):
- Data Science, Machine Learning, AI careers
- Software Engineering, Web Development
- Business, Finance, Marketing careers
- Healthcare, Education, Design careers
- Interview prep, Resume tips, Salary negotiation
- Career transitions, Skill development
- Any job/career related question

⛔ OFF-TOPIC (reject these): cooking, recipes, weather, entertainment, jokes, personal relationships
If truly off-topic: "I focus on career guidance. What career help do you need?"

📏 RESPONSE FORMAT (STRICT):
• MAX 4 bullet points
• Each bullet MAX 20 words
• Be specific and actionable

For ROADMAPS (like Data Science):
📊 **[Career] Path**
• Phase 1: [Foundation skills] (2-4 weeks)
• Phase 2: [Core skills] (4-6 weeks)  
• Phase 3: [Advanced + Projects] (4-8 weeks)
🎯 Key tools: [list 3-4 tools]

For ADVICE:
✅ **Do:** [specific tip]
❌ **Avoid:** [common mistake]
💡 **Quick win:** [immediate action]

${userProfile ? `
👤 USER PROFILE: ${userProfile}
Personalize advice to their background.
` : ''}

Be helpful, specific, and concise. Answer ALL career questions including technical fields like Data Science, ML, AI.`;

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
