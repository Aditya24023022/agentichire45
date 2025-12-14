import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAIAgent } from "@/hooks/useAIAgent";

const PortfolioDescriber = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const { result, loading, generate } = useAIAgent({ type: "portfolio", successMessage: "Portfolio descriptions ready!" });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) navigate("/auth"); });
  }, [navigate]);

  const handleGenerate = async () => {
    if (!resume.trim()) { toast.error("Please describe your projects"); return; }
    await generate({ resume: resume.trim(), jobDescription: jobDescription.trim() });
  };

  const handleCopy = async () => { await navigator.clipboard.writeText(result); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); };

  return (
    <FeaturePageLayout icon={Briefcase} title="Portfolio Describer" description="Turn projects into compelling portfolio entries">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3"><Label>Your Projects / Experience</Label><Textarea value={resume} onChange={(e) => setResume(e.target.value)} className="min-h-[200px] bg-card border-border" placeholder="Describe your projects..." /></div>
          <div className="space-y-3"><Label>Target Role (Optional)</Label><Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="min-h-[100px] bg-card border-border" placeholder="Target role description..." /></div>
          <Button onClick={handleGenerate} variant="hero" size="lg" className="w-full" disabled={loading}>{loading ? <><Loader2 className="w-5 h-5 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Descriptions</>}</Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Portfolio Entries</Label>{result && <Button variant="ghost" size="sm" onClick={handleCopy}>{copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}</Button>}</div>
          <div className="min-h-[500px] p-6 rounded-xl bg-card border border-border overflow-auto">{loading ? <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : result ? <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{result}</pre> : <div className="flex items-center justify-center h-full text-center"><Briefcase className="w-12 h-12 text-muted-foreground/50" /></div>}</div>
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default PortfolioDescriber;
