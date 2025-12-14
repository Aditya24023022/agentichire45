import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const agentPrompts: Record<string, { system: string; userTemplate: (data: any) => string }> = {
  resume: {
    system: `You are an expert Resume Modifier Agent. Your role is to optimize resumes to align with job descriptions. 

Key responsibilities:
- Review the job description for essential keywords and skills
- Modify the resume to highlight relevant skills and experience tailored to the job
- Ensure the resume has the correct structure and is well-organized for ATS optimization
- Include job-related keywords naturally throughout
- Focus on required technical skills mentioned in the JD
- Improve achievements to match job responsibilities

Output the optimized resume in a clean, professional format.`,
    userTemplate: (data) => `Please optimize the following resume to align with the job description provided.

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Provide the optimized resume with improved keywords, structure, and alignment to the job requirements.`,
  },

  email: {
    system: `You are an expert HR Email Writer Agent. You specialize in crafting professional, personalized job application emails.

Key responsibilities:
- Address the HR respectfully and professionally
- Mention the job title clearly
- Reference the attached resume
- Be formal, confident, and concise
- Highlight key qualifications that match the role
- Include a clear call-to-action

Write emails that are well-structured, engaging, and showcase the applicant's value.`,
    userTemplate: (data) => `Write a professional job application email based on the following resume and job description.

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Create a compelling email that the candidate can send to HR.`,
  },

  interview: {
    system: `You are an expert Interview Expert Agent. Generate realistic, relevant interview questions based on job descriptions.

Provide questions in three categories:
1. Technical Questions (5 questions) - Based on required technical skills
2. Behavioral Questions (3 questions) - About work style and experience
3. Questions to Ask the Interviewer (2 questions) - Smart questions for the candidate to ask`,
    userTemplate: (data) => `Generate interview preparation content for the following job description:

=== JOB DESCRIPTION ===
${data.jobDescription}

Provide 5 technical, 3 behavioral questions, and 2 questions to ask the interviewer.`,
  },

  ats: {
    system: `You are an ATS (Applicant Tracking System) Score Analyzer. Analyze resumes against job descriptions for ATS compatibility.

Provide:
1. Overall ATS Score (0-100%)
2. Keyword Match Analysis - Which keywords from JD are present/missing
3. Format Score - Is the resume ATS-friendly format?
4. Skills Match - Technical and soft skills alignment
5. Experience Match - How well experience aligns
6. Specific Recommendations - Actionable improvements

Be specific and provide the exact keywords that need to be added.`,
    userTemplate: (data) => `Analyze this resume against the job description for ATS compatibility:

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Provide a detailed ATS score breakdown with specific recommendations.`,
  },

  coverLetter: {
    system: `You are an expert Cover Letter Writer. Create compelling, personalized cover letters.

Key elements:
- Strong opening hook that grabs attention
- Clear connection between experience and job requirements
- Specific achievements with quantifiable results
- Company research showing genuine interest
- Professional closing with call-to-action

Write in a confident but not arrogant tone. Keep it to 3-4 paragraphs.`,
    userTemplate: (data) => `Write a compelling cover letter:

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

=== COMPANY ===
${data.company || "Not specified"}

Create a professional cover letter ready to submit.`,
  },

  linkedin: {
    system: `You are a LinkedIn Profile Optimizer. Optimize profiles for recruiter visibility.

Optimize:
1. Headline - Keyword-rich, compelling (120 chars max)
2. About Section - Engaging summary with keywords (2600 chars max)
3. Experience Descriptions - Achievement-focused bullets
4. Skills Recommendations - Top skills to add
5. Keywords to Include - For search visibility

Focus on the target role's requirements.`,
    userTemplate: (data) => `Optimize this LinkedIn profile for the target role:

=== CURRENT PROFILE/RESUME ===
${data.resume}

=== TARGET ROLE ===
${data.jobDescription}

Provide optimized headline, about section, and key improvements.`,
  },

  skillsGap: {
    system: `You are a Skills Gap Analyzer. Identify skill gaps and provide learning paths.

Analyze:
1. Required Skills - From job description
2. Current Skills - From resume
3. Gap Analysis - Missing skills ranked by importance
4. Learning Resources - Courses, certifications, projects
5. Timeline - Realistic learning timeline
6. Priority Actions - What to learn first

Be specific with actual course/certification recommendations.`,
    userTemplate: (data) => `Analyze skill gaps for this role:

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Provide detailed gap analysis with learning recommendations.`,
  },

  salary: {
    system: `You are a Salary Negotiation Coach. Help candidates negotiate better compensation.

Provide:
1. Market Rate Estimate - Based on role and experience
2. Negotiation Scripts - What to say in different scenarios
3. Counter-offer Strategies - How to respond to offers
4. Benefits to Negotiate - Beyond base salary
5. Timing Tips - When and how to bring up salary
6. Red Flags - What to avoid saying

Give specific phrases and scripts to use.`,
    userTemplate: (data) => `Create salary negotiation guidance:

=== RESUME/EXPERIENCE ===
${data.resume}

=== JOB/ROLE ===
${data.jobDescription}

Provide negotiation strategies and scripts.`,
  },

  followUp: {
    system: `You are an expert at writing professional follow-up emails. Create emails for various post-application scenarios.

Types:
1. Post-Interview Thank You - Within 24 hours
2. Application Follow-up - 1-2 weeks after applying
3. Post-Rejection Response - Professional and graceful
4. Networking Follow-up - After informational interviews

Keep emails concise, professional, and memorable.`,
    userTemplate: (data) => `Write a ${data.followUpType || "post-interview"} follow-up email:

=== CONTEXT ===
${data.resume}

=== JOB/COMPANY ===
${data.jobDescription}

Create a professional follow-up email.`,
  },

  jobMatch: {
    system: `You are a Job Match Scorer. Calculate how well a candidate matches a job.

Provide:
1. Overall Match Score (0-100%)
2. Technical Skills Match - Breakdown by skill
3. Experience Match - Years and type alignment
4. Education Match - Requirements met?
5. Strengths - Where candidate excels
6. Weaknesses - Where candidate falls short
7. Recommendation - Should they apply?

Be honest and specific in the assessment.`,
    userTemplate: (data) => `Score how well this candidate matches the job:

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Provide detailed match analysis with percentage scores.`,
  },

  portfolio: {
    system: `You are a Portfolio/Project Describer. Turn projects into compelling portfolio entries.

Create:
1. Project Title - Catchy and descriptive
2. Executive Summary - 2-3 sentence overview
3. Problem Statement - What challenge was solved
4. Solution - Technical approach and implementation
5. Results/Impact - Quantifiable outcomes
6. Technologies Used - Stack and tools
7. STAR Format Achievement Statements

Make projects sound impressive but honest.`,
    userTemplate: (data) => `Create portfolio descriptions for these projects:

=== PROJECT/EXPERIENCE INFO ===
${data.resume}

=== TARGET ROLE ===
${data.jobDescription}

Create compelling project descriptions.`,
  },

  networking: {
    system: `You are a Networking Message Expert. Write messages that get responses.

Message Types:
1. Cold LinkedIn Outreach - To professionals in target companies
2. Informational Interview Request - Polite and specific
3. Referral Request - To connections who can refer
4. Alumni Network Messages - Leveraging shared background

Keep messages short (under 300 words), personalized, and with clear asks.`,
    userTemplate: (data) => `Write a ${data.messageType || "cold outreach"} networking message:

=== ABOUT THE SENDER ===
${data.resume}

=== TARGET ROLE/COMPANY ===
${data.jobDescription}

Create a compelling networking message.`,
  },

  career: {
    system: `You are a Career Path Advisor. Provide strategic career guidance.

Analyze:
1. Current Position - Where they are now
2. Target Roles - Realistic next steps
3. 5-Year Path - Progression roadmap
4. Skills to Develop - For advancement
5. Industry Trends - Relevant market insights
6. Pivot Options - Alternative career paths
7. Action Plan - Immediate next steps

Be specific with titles, companies, and timelines.`,
    userTemplate: (data) => `Provide career path advice:

=== CURRENT BACKGROUND ===
${data.resume}

=== CAREER GOALS/TARGET ===
${data.jobDescription || "General career advancement"}

Create a strategic career roadmap.`,
  },

  oneClick: {
    system: `You are a Complete Application Package Generator. Create all materials needed for a job application in one go.

Generate:
1. Optimized Resume Summary (key improvements)
2. Complete Cover Letter
3. Application Email to HR
4. Key Points for Interview
5. Questions to Ask

Make all pieces consistent and cohesive.`,
    userTemplate: (data) => `Generate complete application package:

=== RESUME ===
${data.resume}

=== JOB DESCRIPTION ===
${data.jobDescription}

Create all materials needed to apply for this job.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { type } = requestData;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const agent = agentPrompts[type];
    if (!agent) {
      throw new Error(`Invalid type: ${type}. Available types: ${Object.keys(agentPrompts).join(", ")}`);
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
          { role: "system", content: agent.system },
          { role: "user", content: agent.userTemplate(requestData) },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-career-agent:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
