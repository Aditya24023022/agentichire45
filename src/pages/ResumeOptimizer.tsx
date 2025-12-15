import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { PDFDownload } from "@/components/PDFDownload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Sparkles, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useStreamingAI } from "@/hooks/useStreamingAI";
import { StreamingOutput } from "@/components/StreamingOutput";

const ResumeOptimizer = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const { result, loading, isStreaming, generate, cancel } = useStreamingAI({ 
    type: "resume", 
    successMessage: "Resume optimized!" 
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleOptimize = async () => {
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
      icon={FileText}
      title="Resume Optimizer"
      description="Optimize your resume to match job descriptions and pass ATS systems"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />
          
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label htmlFor="resume" className="text-foreground text-base">
              Your Resume (or paste as text)
            </Label>
            <Textarea
              id="resume"
              placeholder="Paste your resume content here or upload a file above..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[150px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="jd" className="text-foreground text-base">
              Job Description
            </Label>
            <Textarea
              id="jd"
              placeholder="Paste the job description here or use the URL scraper above..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[150px] bg-card border-border resize-none"
            />
          </div>

          {isStreaming ? (
            <Button onClick={cancel} variant="destructive" size="lg" className="w-full">
              <X className="w-5 h-5" />
              Stop Generation
            </Button>
          ) : (
            <Button onClick={handleOptimize} variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Optimize Resume
                </>
              )}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-base">Optimized Resume</Label>
            {result && !isStreaming && (
              <div className="flex gap-2">
                <PDFDownload content={result} fileName="optimized-resume" variant="outline" />
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-[500px] p-6 rounded-xl bg-card border border-border overflow-auto">
            <StreamingOutput
              content={result}
              isStreaming={isStreaming}
              loading={loading}
              placeholder={
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Your optimized resume will appear here</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Watch it generate in real-time</p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default ResumeOptimizer;
