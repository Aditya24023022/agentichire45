import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, FileText, Mail, MessageSquare, Award } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-glow opacity-60" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      <div className="container mx-auto px-4 relative z-10 pt-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground/90">AI-Powered Career Enhancement</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Land Your Dream Job with{" "}
            <span className="text-gradient">AI Agents</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            AgenticHire uses autonomous AI agents to optimize your resume, craft compelling emails, and prepare you for interviews. All tailored to your target job.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="hero" size="xl">
              <Link to="/auth?mode=signup">
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="#features">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Expert CTA */}
          <div className="mb-16 animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <Link 
              to="/auth?mode=signup&role=expert"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium group"
            >
              <Award className="w-4 h-4" />
              <span>Are you an industry expert? Join our Career Community</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Feature Cards Preview */}
          <div className="grid md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <FeaturePreviewCard
              icon={FileText}
              title="Resume Optimizer"
              description="ATS-friendly optimization"
            />
            <FeaturePreviewCard
              icon={Mail}
              title="Email Writer"
              description="Professional job emails"
            />
            <FeaturePreviewCard
              icon={MessageSquare}
              title="Interview Prep"
              description="Custom interview questions"
            />
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

const FeaturePreviewCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="glass rounded-2xl p-6 text-left hover:scale-[1.02] transition-transform cursor-pointer group">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
