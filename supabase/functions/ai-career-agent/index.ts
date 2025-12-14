import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, resume, jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "resume":
        systemPrompt = `You are an expert Resume Modifier Agent. Your role is to optimize resumes to align with job descriptions. 

Key responsibilities:
- Review the job description for essential keywords and skills
- Modify the resume to highlight relevant skills and experience tailored to the job
- Ensure the resume has the correct structure and is well-organized for ATS optimization
- Include job-related keywords naturally throughout
- Focus on required technical skills mentioned in the JD
- Improve achievements to match job responsibilities

Output the optimized resume in a clean, professional format using markdown.`;
        
        userPrompt = `Please optimize the following resume to align with the job description provided.

=== RESUME ===
${resume}

=== JOB DESCRIPTION ===
${jobDescription}

Provide the optimized resume with improved keywords, structure, and alignment to the job requirements.`;
        break;

      case "email":
        systemPrompt = `You are an expert HR Email Writer Agent. You specialize in crafting professional, personalized job application emails that catch recruiters' attention.

Key responsibilities:
- Address the HR respectfully and professionally
- Mention the job title clearly
- Reference the attached resume
- Be formal, confident, and concise
- Highlight key qualifications that match the role
- Include a clear call-to-action

Write emails that are well-structured, engaging, and showcase the applicant's value.`;
        
        userPrompt = `Write a professional job application email based on the following resume and job description.

=== RESUME ===
${resume}

=== JOB DESCRIPTION ===
${jobDescription}

Create a compelling email that the candidate can send to HR. The email should be ready to copy and use directly.`;
        break;

      case "interview":
        systemPrompt = `You are an expert Interview Expert Agent. You are a senior tech recruiter who generates realistic, relevant interview questions based on job descriptions.

Key responsibilities:
- Analyze the job description to understand technical skills and job expectations
- Generate interview questions related to those technical skills
- Ensure questions are challenging and relevant to the role
- Cover all key areas the employer would focus on

Provide questions in three categories:
1. Technical Questions (5 questions) - Based on required technical skills
2. Behavioral Questions (3 questions) - About work style and experience
3. Questions to Ask the Interviewer (2 questions) - Smart questions for the candidate to ask`;
        
        userPrompt = `Generate interview preparation content for the following job description:

=== JOB DESCRIPTION ===
${jobDescription}

Please provide:
- 5 Technical interview questions specific to the role
- 3 Behavioral interview questions
- 2 Smart questions the candidate should ask the interviewer

Format each question clearly with its category.`;
        break;

      default:
        throw new Error("Invalid type specified");
    }

    console.log(`Processing ${type} request...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error("No response from AI");
    }

    console.log(`Successfully processed ${type} request`);

    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in ai-career-agent:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
