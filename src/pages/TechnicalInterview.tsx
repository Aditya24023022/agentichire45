import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Code, Loader2, Play, CheckCircle2, Star, ArrowLeft, Mic } from "lucide-react";
import { toast } from "sonner";
import AIInterviewer from "@/components/AIInterviewer";

interface InterviewResults {
  score: number;
  feedback: string;
  responses: string[];
  questions: string[];
  duration: number;
}

const TechnicalInterview = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [phase, setPhase] = useState<"setup" | "interview" | "results">("setup");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
    loadSavedResume();
  }, [navigate]);

  const loadSavedResume = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("resumes")
        .select("parsed_content")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.parsed_content) {
        setResume(data.parsed_content);
      }
    }
  };

  const handleStartInterview = () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
    }
    setPhase("interview");
  };

  const handleInterviewComplete = async (data: InterviewResults) => {
    setResults(data);
    setPhase("results");

    if (userId) {
      try {
        await supabase.from("interview_sessions").insert({
          user_id: userId,
          job_description: jobDescription,
          resume_content: resume,
          questions: data.questions as any,
          responses: data.responses as any,
          score: data.score,
          feedback: `[Technical Interview] ${data.feedback}`,
          duration_seconds: data.duration,
          completed_at: new Date().toISOString(),
        });
        toast.success("Interview saved to your profile!");
      } catch (error) {
        console.error("Failed to save interview:", error);
      }
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setResults(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <FeaturePageLayout
      icon={Code}
      title="Technical Interview"
      description="Practice with Arjun, your AI Technical Interviewer - role-specific coding & system design questions"
    >
      {phase === "setup" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10 border border-accent/30">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-3xl">
                👨‍💻
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Meet Arjun</h3>
                <p className="text-sm text-muted-foreground">
                  Your AI Technical Interviewer. He'll ask coding, system design, and role-specific technical questions based on your target job.
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <Mic className="w-4 h-4 text-accent" />
                <span>Voice-based</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <Code className="w-4 h-4 text-primary" />
                <span>Technical Questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Role-specific</span>
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
            <h4 className="text-sm font-medium text-foreground mb-2">Technical Interview Format:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Allow microphone access when prompted</li>
              <li>Arjun will ask about your technical background</li>
              <li>Expect coding concepts, system design, and problem-solving questions</li>
              <li>After 7 questions, you'll receive detailed technical feedback</li>
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
            Start Technical Interview
          </Button>
        </div>
      )}

      {phase === "interview" && (
        <AIInterviewer
          jobDescription={jobDescription}
          resumeContent={resume}
          onInterviewComplete={handleInterviewComplete}
          interviewType="technical"
        />
      )}

      {phase === "results" && results && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10 border border-accent/30 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-accent">{results.score}</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Technical Interview Complete!</h2>
            <p className="text-muted-foreground">Duration: {formatDuration(results.duration)}</p>
            
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-6 h-6 ${i < Math.floor(results.score / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">Feedback from Arjun</h3>
            <p className="text-muted-foreground leading-relaxed">{results.feedback}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-3xl font-bold text-accent">{results.questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions Asked</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-3xl font-bold text-primary">{results.responses.length}</p>
              <p className="text-sm text-muted-foreground">Responses Given</p>
            </div>
          </div>

          {results.questions.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Conversation Summary</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {results.questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm text-accent font-medium">Arjun: {q}</p>
                    {results.responses[i] && (
                      <p className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                        You: {results.responses[i]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={resetInterview} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4" />
              New Interview
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="hero" className="flex-1">
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
    </FeaturePageLayout>
  );
};

export default TechnicalInterview;
