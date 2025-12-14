import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ResumeOptimizer = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleOptimize = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please fill in both your resume and the job description");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await supabase.functions.invoke("ai-career-agent", {
        body: {
          type: "resume",
          resume: resume.trim(),
          jobDescription: jobDescription.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data.result);
      toast.success("Resume optimized successfully!");
    } catch (error: any) {
      console.error("Error:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message?.includes("402")) {
        toast.error("Please add credits to continue using AI features.");
      } else {
        toast.error("Failed to optimize resume. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Resume Optimizer
                </h1>
                <p className="text-muted-foreground">
                  Optimize your resume to match the job description
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="resume" className="text-foreground text-base">
                  Your Resume (paste as text)
                </Label>
                <Textarea
                  id="resume"
                  placeholder="Paste your resume content here..."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="min-h-[200px] bg-card border-border resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="jd" className="text-foreground text-base">
                  Job Description
                </Label>
                <Textarea
                  id="jd"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] bg-card border-border resize-none"
                />
              </div>

              <Button
                onClick={handleOptimize}
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
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
            </div>

            {/* Output Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-base">Optimized Resume</Label>
                {result && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="min-h-[460px] p-6 rounded-xl bg-card border border-border overflow-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">AI is optimizing your resume...</p>
                  </div>
                ) : result ? (
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{result}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Your optimized resume will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeOptimizer;
