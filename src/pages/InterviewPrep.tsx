import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";

const InterviewPrep = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const { result, loading, generate } = useAIAgent({ type: "interview", successMessage: "Questions generated!" });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please fill in the job description");
      return;
    }
    await generate({ jobDescription: jobDescription.trim() });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FeaturePageLayout
      icon={MessageSquare}
      title="Interview Prep"
      description="Get customized interview questions based on the job description"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job Description</Label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[300px] bg-card border-border resize-none"
            />
          </div>

          <Button onClick={handleGenerate} variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Questions
              </>
            )}
          </Button>

          <div className="p-4 rounded-lg bg-accent/50 border border-border">
            <p className="text-sm text-accent-foreground">
              <strong>Tip:</strong> The more detailed the job description, the more relevant the questions will be.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-base">Interview Questions</Label>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <div className="min-h-[500px] p-6 rounded-xl bg-card border border-border overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">AI is generating interview questions...</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{result}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Interview questions will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default InterviewPrep;
