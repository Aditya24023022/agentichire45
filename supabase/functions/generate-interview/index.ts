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

    const { action, jobDescription, resume, userResponse, question, allResponses } = await req.json();

    if (action === 'generate-questions') {
      console.log('Generating interview questions...');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
          {
              role: 'system',
              content: `You are Priya, an experienced HR professional conducting an initial screening interview. Generate exactly 7 HR-style interview questions - NOT technical questions. Focus on:
- Behavioral questions (Tell me about a time when...)
- Situational questions (What would you do if...)
- Culture fit questions (Why do you want to work here...)
- Experience questions (Walk me through your background...)
- Soft skills questions (How do you handle pressure...)

Return ONLY a JSON array of objects with "question" and "category" fields. Categories should be: "Behavioral", "Situational", "Experience", "Culture Fit", or "Soft Skills". Questions should be medium difficulty - not too basic, not too advanced. Make them conversational and professional.`
            },
            {
              role: 'user',
              content: `Job Description:\n${jobDescription}\n\nCandidate Resume:\n${resume}\n\nGenerate 7 HR screening interview questions (no technical questions).`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse questions');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      console.log('Generated questions:', questions.length);

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'evaluate-response') {
      console.log('Evaluating response...');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert interviewer evaluating a candidate's response. Provide brief, constructive feedback (2-3 sentences) and a score from 1-10.`
            },
            {
              role: 'user',
              content: `Question: ${question}\n\nCandidate's Response: ${userResponse}\n\nProvide feedback and score in this JSON format: {"feedback": "...", "score": X}`
            }
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse evaluation');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify(evaluation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'final-evaluation') {
      console.log('Generating final evaluation...');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert interviewer providing final feedback. Analyze all responses and provide comprehensive feedback including strengths, areas for improvement, and overall readiness for the role.`
            },
            {
              role: 'user',
              content: `Job Description:\n${jobDescription}\n\nInterview Responses:\n${JSON.stringify(allResponses, null, 2)}\n\nProvide final evaluation in this JSON format: {"overallScore": X (1-100), "strengths": ["..."], "improvements": ["..."], "summary": "..."}`
            }
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse final evaluation');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify(evaluation), {
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
