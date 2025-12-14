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
import { Input } from "@/components/ui/input";
import { FileSignature, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";

const CoverLetter = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [copied, setCopied] = useState(false);
  const { result, loading, generate } = useAIAgent({ type: "coverLetter", successMessage: "Cover letter generated!" });

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
    await generate({ resume: resume.trim(), jobDescription: jobDescription.trim(), company: company.trim() });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FeaturePageLayout
      icon={FileSignature}
      title="Cover Letter Generator"
      description="Create compelling, personalized cover letters that stand out"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <JobUrlInput onJobScraped={(content, metadata) => {
            setJobDescription(content);
            if (metadata?.title) setCompany(metadata.title.split(" at ")?.[1] || "");
          }} />
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Company Name (Optional)</Label>
            <Input
              placeholder="e.g., Google, Microsoft..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Your Resume</Label>
            <Textarea
              placeholder="Paste your resume content here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job Description</Label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
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
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-base">Your Cover Letter</Label>
            {result && (
              <div className="flex gap-2">
                <PDFDownload content={result} fileName="cover-letter" variant="outline" />
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-[500px] p-6 rounded-xl bg-card border border-border overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">AI is writing your cover letter...</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{result}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileSignature className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your cover letter will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default CoverLetter;
