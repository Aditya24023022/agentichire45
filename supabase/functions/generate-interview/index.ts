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

    const { action, jobDescription, resume, userResponse, question, allResponses, interviewType } = await req.json();
    const isHR = interviewType !== 'technical';

    if (action === 'generate-questions') {
      console.log(`Generating ${isHR ? 'HR' : 'technical'} interview questions...`);
      
      const systemPrompt = isHR 
        ? `You are Priya, an experienced Senior HR Professional with 12+ years of experience in talent acquisition. You're conducting an initial screening interview.

Your style:
- Warm but professional tone
- Listen for cultural fit and communication skills
- Probe for specific examples and results
- Adapt difficulty based on seniority indicated in resume

Generate EXACTLY 7 personalized HR questions based on the candidate's resume and the job requirements. Each question should:
1. Reference something specific from their resume OR the job requirements
2. Be appropriate for their experience level
3. Test a different competency

Question types to include (mix based on relevance):
- Behavioral (STAR format): "Tell me about a time when..."
- Situational: "How would you handle..."
- Motivation: "Why are you interested in..."
- Cultural fit: "What kind of work environment..."
- Experience verification: "I see you worked on X, tell me more about..."

Return ONLY a JSON array with objects containing "question" and "category" fields.
Categories: "Behavioral", "Situational", "Experience", "Culture Fit", "Motivation"`
        : `You are Arjun, a Senior Technical Lead with 15+ years of experience in software engineering and architecture. You're conducting a technical interview.

Your style:
- Direct and technical
- Test both depth and breadth of knowledge
- Start with fundamentals, then go deeper based on responses
- Look for problem-solving approach, not just answers

Generate EXACTLY 7 personalized technical questions based on:
1. The technologies mentioned in the job description
2. The candidate's claimed technical skills from their resume
3. The seniority level of the role

Question types to include:
- Conceptual: Test understanding of core concepts
- Practical: Real-world scenarios and problem-solving
- System Design: Architecture and scalability (for senior roles)
- Debugging: "How would you troubleshoot..."
- Best Practices: Testing, code quality, security

IMPORTANT: Questions MUST be specific to the tech stack in the JD and resume. If they mention React, ask React questions. If Python, ask Python questions.

Return ONLY a JSON array with objects containing "question" and "category" fields.
Categories: "Conceptual", "Practical", "System Design", "Problem Solving", "Best Practices"`;

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
            {
              role: 'user',
              content: `═══════════════════════════════════════
JOB DESCRIPTION (Target Role):
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
CANDIDATE RESUME:
═══════════════════════════════════════
${resume}

Generate 7 personalized ${isHR ? 'HR screening' : 'technical'} interview questions that are SPECIFIC to this candidate and role. Reference actual details from their background.`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
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
              content: `You are an expert ${isHR ? 'HR' : 'technical'} interviewer evaluating a candidate's response. 
              
Provide:
1. A score from 1-10
2. Brief feedback (2-3 sentences) highlighting what was good and what could be improved
3. Be constructive and specific

Return JSON format: {"feedback": "...", "score": X}`
            },
            {
              role: 'user',
              content: `Question: ${question}\n\nCandidate's Response: ${userResponse}\n\nEvaluate this response.`
            }
          ],
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
      console.log('Generating comprehensive final report...');
      
      const reportPrompt = isHR
        ? `You are Priya, the Senior HR Professional who just completed an interview. Generate a comprehensive interview report.

## Report Structure:

### 📊 OVERALL SCORE: [X/100]

### 📈 COMPETENCY BREAKDOWN
Rate each competency 1-10:
- Communication Skills: [X/10] - [Brief assessment]
- Cultural Fit: [X/10] - [Brief assessment]  
- Experience Relevance: [X/10] - [Brief assessment]
- Problem-Solving Approach: [X/10] - [Brief assessment]
- Motivation & Interest: [X/10] - [Brief assessment]

### ✅ STRENGTHS IDENTIFIED
List 3-5 specific strengths demonstrated during the interview with examples.

### ⚠️ AREAS FOR IMPROVEMENT
List 3-5 areas where the candidate could improve, with specific suggestions.

### 💡 RECOMMENDATIONS
- Interview Performance Tips
- Skills to Highlight in Future Interviews
- Topics to Prepare Better

### 🎯 HIRING RECOMMENDATION
**Recommendation**: [Strong Hire / Hire / Maybe / No Hire]
**Confidence**: [High / Medium / Low]
**Summary**: 2-3 sentences on overall impression.

Be specific, reference actual responses, and provide actionable feedback.`
        : `You are Arjun, the Technical Lead who just completed a technical interview. Generate a comprehensive technical assessment report.

## Report Structure:

### 📊 OVERALL TECHNICAL SCORE: [X/100]

### 📈 TECHNICAL COMPETENCY BREAKDOWN
Rate each area 1-10:
- Core Technical Knowledge: [X/10] - [Assessment]
- Problem-Solving Ability: [X/10] - [Assessment]
- Code Quality Awareness: [X/10] - [Assessment]
- System Design Thinking: [X/10] - [Assessment]
- Learning Agility: [X/10] - [Assessment]

### ✅ TECHNICAL STRENGTHS
List specific technical strengths with examples from responses.

### ⚠️ TECHNICAL GAPS
List areas where technical knowledge or approach needs improvement.

### 📚 LEARNING RECOMMENDATIONS
- Specific topics to study
- Resources or courses to take
- Projects to build for practice

### 🔧 CODING/TECHNICAL TIPS
Practical advice for improving technical interview performance.

### 🎯 TECHNICAL FIT ASSESSMENT
**Technical Level**: [Junior / Mid / Senior / Staff]
**Role Fit**: [Strong Match / Good Match / Partial Match / Not a Match]
**Summary**: Technical assessment summary.

Be specific and technical in your feedback.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: reportPrompt },
            {
              role: 'user',
              content: `═══════════════════════════════════════
JOB DESCRIPTION:
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
INTERVIEW TRANSCRIPT:
═══════════════════════════════════════
${JSON.stringify(allResponses, null, 2)}

Generate a comprehensive interview report based on the candidate's responses.`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse structured JSON, fallback to markdown report
      let evaluation;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          // Return full markdown report
          evaluation = {
            overallScore: 75,
            report: content,
            strengths: [],
            improvements: [],
            summary: "See detailed report above."
          };
        }
      } catch {
        evaluation = {
          overallScore: 75,
          report: content,
          strengths: [],
          improvements: [],
          summary: "See detailed report above."
        };
      }

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
