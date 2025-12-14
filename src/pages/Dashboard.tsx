import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { FileText, Mail, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-accent-foreground">AI Career Assistant</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Welcome back, <span className="text-gradient">{userName}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose a tool to enhance your job application
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={FileText}
              title="Resume Optimizer"
              description="Upload your resume and job description. Our AI agent will optimize your resume with relevant keywords and ATS-friendly formatting."
              href="/resume-optimizer"
              color="primary"
            />
            <FeatureCard
              icon={Mail}
              title="HR Email Writer"
              description="Generate professional job application emails tailored to the specific role and company you're applying to."
              href="/email-writer"
              color="primary"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Interview Prep"
              description="Get customized interview questions based on the job description to prepare for your upcoming interviews."
              href="/interview-prep"
              color="primary"
            />
          </div>

          {/* Quick Tips */}
          <div className="mt-16">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">Quick Tips</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">Start with Resume Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  First, optimize your resume for the specific job. Then use the optimized content for your email and interview prep.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">Include Full Job Descriptions</h3>
                <p className="text-sm text-muted-foreground">
                  The more detailed the job description, the better our AI agents can tailor your materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  color: string;
}) => (
  <Link
    to={href}
    className="group relative rounded-2xl p-8 bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button variant="ghost" className="group-hover:bg-primary/10 gap-2">
        Get Started
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  </Link>
);

export default Dashboard;
