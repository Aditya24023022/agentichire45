import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MailCheck, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";

const FollowUpEmail = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [followUpType, setFollowUpType] = useState("post-interview");
  const [copied, setCopied] = useState(false);
  const { result, loading, generate } = useAIAgent({ type: "followUp", successMessage: "Follow-up email generated!" });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please fill in the job/company information");
      return;
    }
    await generate({ resume: resume.trim(), jobDescription: jobDescription.trim(), followUpType });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FeaturePageLayout
      icon={MailCheck}
      title="Follow-up Email Generator"
      description="Create professional follow-up emails for any situation"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Email Type</Label>
            <Select value={followUpType} onValueChange={setFollowUpType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post-interview">Post-Interview Thank You</SelectItem>
                <SelectItem value="application-followup">Application Follow-up</SelectItem>
                <SelectItem value="post-rejection">Post-Rejection Response</SelectItem>
                <SelectItem value="networking">Networking Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Context (Optional)</Label>
            <Textarea
              placeholder="Add any relevant context about yourself..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job / Company Info</Label>
            <Textarea
              placeholder="Paste the job description or describe the company/role..."
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
            <Label className="text-foreground text-base">Follow-up Email</Label>
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
                <MailCheck className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your email will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default FollowUpEmail;
