import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Video, Loader2, Play, CheckCircle2, Star, ArrowLeft, Mic } from "lucide-react";
import { toast } from "sonner";
import interviewerAvatar from "@/assets/interviewer-avatar.png";
import AIInterviewer from "@/components/AIInterviewer";

interface InterviewResults {
  score: number;
  feedback: string;
  responses: string[];
  questions: string[];
  duration: number;
}

const MockInterview = () => {
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
  }, [navigate]);

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

    // Save to database
    if (userId) {
      try {
        await supabase.from("interview_sessions").insert({
          user_id: userId,
          job_description: jobDescription,
          resume_content: resume,
          questions: data.questions as any,
          responses: data.responses as any,
          score: data.score,
          feedback: data.feedback,
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
      icon={Video}
      title="Mock Interview"
      description="Practice with Priya, your AI HR interviewer - real-time conversation with instant feedback"
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
                  Your AI HR interviewer. She'll conduct a real-time voice interview with 7 questions and provide personalized feedback.
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
                <span>No recording needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full">
                <Video className="w-4 h-4 text-accent" />
                <span>No camera required</span>
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
            <h4 className="text-sm font-medium text-foreground mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Allow microphone access when prompted</li>
              <li>Priya will greet you and start asking questions</li>
              <li>Just speak naturally to answer - no buttons needed</li>
              <li>After 7 questions, you'll receive your score and feedback</li>
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
            Start Interview
          </Button>
        </div>
      )}

      {phase === "interview" && (
        <AIInterviewer
          jobDescription={jobDescription}
          resumeContent={resume}
          onInterviewComplete={handleInterviewComplete}
        />
      )}

      {phase === "results" && results && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Score Card */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{results.score}</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Interview Complete!</h2>
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

          {/* Feedback */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">Feedback from Priya</h3>
            <p className="text-muted-foreground leading-relaxed">{results.feedback}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-3xl font-bold text-primary">{results.questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions Asked</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
              <p className="text-3xl font-bold text-accent">{results.responses.length}</p>
              <p className="text-sm text-muted-foreground">Responses Given</p>
            </div>
          </div>

          {/* Conversation Summary */}
          {results.questions.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Conversation Summary</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {results.questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm text-primary font-medium">Priya: {q}</p>
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

          {/* Actions */}
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

export default MockInterview;
