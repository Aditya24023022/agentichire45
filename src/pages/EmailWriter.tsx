import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";

const EmailWriter = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const { result, loading, generate } = useAIAgent({ type: "email", successMessage: "Email generated!" });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleGenerate = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please fill in both your resume and the job description");
      return;
    }
    await generate({ resume: resume.trim(), jobDescription: jobDescription.trim() });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FeaturePageLayout
      icon={Mail}
      title="HR Email Writer"
      description="Generate professional job application emails that get responses"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Your Resume</Label>
            <Textarea
              placeholder="Paste your resume content here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[150px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job Description</Label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[150px] bg-card border-border resize-none"
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
                Generate Email
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-base">Generated Email</Label>
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
                <p className="text-muted-foreground">AI is writing your email...</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{result}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Mail className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your email will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default EmailWriter;
