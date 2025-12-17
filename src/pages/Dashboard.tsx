import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
  FileText, Mail, MessageSquare, ArrowRight, Sparkles, Target, FileSignature, 
  Linkedin, TrendingUp, DollarSign, MailCheck, Search, Briefcase, Users, Compass, Video, Code 
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import FloatingChatbot from "@/components/FloatingChatbot";
import ProfileOnboarding from "@/components/ProfileOnboarding";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Check if profile is completed
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_completed")
          .eq("id", session.user.id)
          .single();
        
        if (!profile?.profile_completed) {
          setShowOnboarding(true);
        }
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

  const coreTools = [
    { icon: FileText, title: "Resume Optimizer", description: "Optimize your resume with ATS-friendly keywords", href: "/resume-optimizer" },
    { icon: FileSignature, title: "Cover Letter", description: "Create compelling personalized cover letters", href: "/cover-letter" },
    { icon: Mail, title: "HR Email Writer", description: "Generate professional job application emails", href: "/email-writer" },
    { icon: MessageSquare, title: "Interview Prep", description: "Get customized interview questions", href: "/interview-prep" },
  ];

  const analysisTools = [
    { icon: Target, title: "ATS Analyzer", description: "Check your resume's ATS compatibility score", href: "/ats-analyzer" },
    { icon: TrendingUp, title: "Skills Gap", description: "Identify missing skills and learning paths", href: "/skills-gap" },
    { icon: Search, title: "Job Match", description: "See how well you match a job posting", href: "/job-match" },
    { icon: Compass, title: "Career Advisor", description: "Get strategic career guidance", href: "/career-advisor" },
  ];

  const networkingTools = [
    { icon: Linkedin, title: "LinkedIn Optimizer", description: "Optimize your profile for recruiters", href: "/linkedin-optimizer" },
    { icon: MailCheck, title: "Follow-up Emails", description: "Create post-interview thank you emails", href: "/follow-up-email" },
    { icon: Users, title: "Networking Messages", description: "Write messages that get responses", href: "/networking-messages" },
    { icon: DollarSign, title: "Salary Coach", description: "Negotiation scripts and strategies", href: "/salary-coach" },
    { icon: Briefcase, title: "Portfolio Describer", description: "Turn projects into portfolio entries", href: "/portfolio-describer" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {showOnboarding && user && (
        <ProfileOnboarding 
          userId={user.id} 
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Welcome Section */}
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-accent-foreground">AI Career Assistant</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                  Welcome back, <span className="text-gradient">{userName}</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  14 AI-powered tools to supercharge your job search
                </p>
              </div>

              {/* Featured: Interview Options */}
              <div className="grid md:grid-cols-2 gap-4 mb-10">
                <Link
                  to="/mock-interview"
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-glow block"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Video className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-display font-bold text-foreground">HR Interview</h2>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">Priya</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Practice behavioral & situational questions with our HR interviewer
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link
                  to="/technical-interview"
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10 border border-accent/30 hover:border-accent/60 transition-all duration-300 hover:shadow-glow block"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-3">
                    <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                      <Code className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-display font-bold text-foreground">Technical Interview</h2>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/20 text-accent">Arjun</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Practice coding concepts & system design with our tech lead
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Core Tools */}
              <div className="mb-10">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Core Tools
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {coreTools.map((tool) => (
                    <FeatureCard key={tool.href} {...tool} />
                  ))}
                </div>
              </div>

              {/* Analysis Tools */}
              <div className="mb-10">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Analysis & Planning
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analysisTools.map((tool) => (
                    <FeatureCard key={tool.href} {...tool} />
                  ))}
                </div>
              </div>

              {/* Networking Tools */}
              <div className="mb-10">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Networking & Communication
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {networkingTools.map((tool) => (
                    <FeatureCard key={tool.href} {...tool} compact />
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-12">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">Quick Tips</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground mb-2">📎 Upload or Paste URL</h3>
                    <p className="text-sm text-muted-foreground">
                      You can upload your resume as PDF or paste a job URL to auto-extract descriptions.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground mb-2">📄 Download as PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Generated resumes and cover letters can be downloaded directly as PDF files.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground mb-2">🎯 Start with ATS Check</h3>
                    <p className="text-sm text-muted-foreground">
                      Run your resume through the ATS Analyzer first to identify improvement areas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  href,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  compact?: boolean;
}) => (
  <Link
    to={href}
    className={`group relative rounded-xl ${compact ? 'p-4' : 'p-5'} bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow`}
  >
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative">
      <div className={`${compact ? 'w-10 h-10 mb-3' : 'w-12 h-12 mb-4'} rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors`}>
        <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
      </div>
      <h3 className={`${compact ? 'text-sm' : 'text-base'} font-display font-bold text-foreground mb-1`}>{title}</h3>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground line-clamp-2`}>{description}</p>
    </div>
  </Link>
);

export default Dashboard;
