import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Play, ArrowLeft, Mic, CheckCircle2, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import interviewerAvatar from "@/assets/interviewer-avatar.png";
import AIInterviewer from "@/components/AIInterviewer";
import InterviewReport from "@/components/InterviewReport";

interface InterviewResults {
  score: number;
  feedback: string;
  responses: string[];
  questions: string[];
  duration: number;
  report?: string;
}

const MockInterview = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [phase, setPhase] = useState<"setup" | "interview" | "results">("setup");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
  }, [navigate]);

  const handleStartInterview = () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
    }
    setPhase("interview");
  };

  const generateDetailedReport = async (data: InterviewResults) => {
    setGeneratingReport(true);
    try {
      const allResponses = data.questions.map((q, i) => ({
        question: q,
        response: data.responses[i] || "No response provided"
      }));

      const response = await supabase.functions.invoke("generate-interview", {
        body: {
          action: "final-evaluation",
          jobDescription,
          allResponses,
          interviewType: "hr"
        }
      });

      if (response.data?.report) {
        setReport(response.data.report);
        return response.data.report;
      } else if (response.data?.summary) {
        const reportText = `## Interview Summary\n\n${response.data.summary}\n\n### Strengths\n${(response.data.strengths || []).map((s: string) => `- ${s}`).join('\n')}\n\n### Areas for Improvement\n${(response.data.improvements || []).map((i: string) => `- ${i}`).join('\n')}`;
        setReport(reportText);
        return reportText;
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate detailed report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleInterviewComplete = async (data: InterviewResults) => {
    setResults(data);
    setPhase("results");

    // Generate detailed report
    const reportContent = await generateDetailedReport(data);

    // Save to database
    if (userId) {
      try {
        await supabase.from("interview_sessions").insert([{
          user_id: userId,
          job_description: jobDescription,
          resume_content: resume,
          questions: data.questions,
          responses: data.responses,
          score: data.score,
          feedback: reportContent || data.feedback,
          duration_seconds: data.duration,
          completed_at: new Date().toISOString(),
        }]);
        toast.success("Interview saved to your profile!");
      } catch (error) {
        console.error("Failed to save interview:", error);
      }
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setResults(null);
    setReport("");
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadReport = () => {
    const content = `
INTERVIEW REPORT
================
Date: ${new Date().toLocaleDateString()}
Duration: ${results ? formatDuration(results.duration) : 'N/A'}
Score: ${results?.score || 0}/100

${report}

---
CONVERSATION TRANSCRIPT
---
${results?.questions.map((q, i) => `
Q: ${q}
A: ${results?.responses[i] || 'No response'}
`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FeaturePageLayout
      icon={Video}
      title="HR Mock Interview"
      description="Practice with Priya, your AI HR interviewer - real-time conversation with detailed feedback report"
    >
      {phase === "setup" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Interviewer Introduction */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30">
            <div className="flex items-center gap-4">
              <img 
                src={interviewerAvatar} 
                alt="Priya - AI Interviewer" 
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Meet Priya</h3>
                <p className="text-sm text-muted-foreground">
                  Your AI HR interviewer. She'll conduct a real-time voice interview with personalized questions based on YOUR resume and the job description.
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <Mic className="w-4 h-4 text-primary" />
                <span>Voice-based</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Personalized questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <FileText className="w-4 h-4 text-accent" />
                <span>Detailed report</span>
              </div>
            </div>
          </div>

          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Your Resume</Label>
            <Textarea
              placeholder="Paste your resume or upload above..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job Description</Label>
            <Textarea
              placeholder="Paste the job description or use URL above..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">What to expect:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Allow microphone access when prompted</li>
              <li>Priya will ask 7 personalized HR questions based on your profile</li>
              <li>Just speak naturally to answer - no buttons needed</li>
              <li>Receive a comprehensive report with scores and improvement areas</li>
            </ol>
          </div>

          <Button 
            onClick={handleStartInterview} 
            variant="hero" 
            size="lg" 
            className="w-full" 
            disabled={loading || !resume.trim() || !jobDescription.trim()}
          >
            <Play className="w-5 h-5" />
            Start HR Interview
          </Button>
        </div>
      )}

      {phase === "interview" && (
        <AIInterviewer
          jobDescription={jobDescription}
          resumeContent={resume}
          onInterviewComplete={handleInterviewComplete}
          interviewType="hr"
        />
      )}

      {phase === "results" && results && (
        <div className="max-w-4xl mx-auto space-y-6">
          {generatingReport ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Generating your detailed interview report...</p>
            </div>
          ) : (
            <>
              <InterviewReport
                score={results.score}
                feedback={results.feedback}
                questions={results.questions}
                responses={results.responses}
                duration={results.duration}
                interviewType="hr"
              />

              {/* Conversation Transcript */}
              {results.questions.length > 0 && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">📝 Conversation Transcript</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {results.questions.map((q, i) => (
                      <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/20">
                        <p className="text-sm text-primary font-medium">🎤 Priya: {q}</p>
                        {results.responses[i] && (
                          <p className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                            👤 You: {results.responses[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={resetInterview} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4" />
                  New Interview
                </Button>
                <Button onClick={downloadReport} variant="outline" className="flex-1">
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="hero" className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </FeaturePageLayout>
  );
};

export default MockInterview;
