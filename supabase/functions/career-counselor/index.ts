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

    const systemPrompt = `You are a CONCISE Career Counselor AI. ONLY help with career topics.

⛔ OFF-TOPIC: If asked about non-career topics (cooking, weather, health, etc.), reply:
"I only help with career questions! What career guidance do you need?"

📏 RESPONSE RULES (STRICT):
1. MAX 3-4 bullet points per response
2. Each bullet MAX 15 words
3. Use these exact formats:

For ROADMAPS:
📊 **[Skill] Path**
• Step 1 → Step 2 → Step 3
⏱️ Timeline: X weeks

For ADVICE:
✅ **Do:** [short tip]
❌ **Avoid:** [short tip]
💡 **Quick win:** [action]

For COMPARISONS:
| Option | Pros | Cons |
|--------|------|------|
| A | x | y |

${userProfile ? `
👤 USER: ${userProfile}
Reference their background briefly.
` : ''}

BE ULTRA CONCISE. No fluff. Direct answers only.`;

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
