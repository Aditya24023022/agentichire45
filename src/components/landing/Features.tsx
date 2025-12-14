import { FileText, Mail, MessageSquare, Zap, Shield, Target } from "lucide-react";

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Three Powerful <span className="text-gradient">AI Agents</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each agent specializes in a critical aspect of your job application process
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={FileText}
            title="Resume Modifier Agent"
            description="Analyzes job descriptions and optimizes your resume with relevant keywords, improved formatting, and ATS-friendly structure."
            features={[
              "Keyword optimization",
              "ATS-friendly formatting",
              "Skills alignment",
              "Achievement highlighting"
            ]}
            gradient="from-primary/20 to-accent/20"
          />
          <FeatureCard
            icon={Mail}
            title="HR Email Writer Agent"
            description="Crafts professional, personalized job application emails that catch recruiters' attention and convey your value."
            features={[
              "Professional tone",
              "Personalized content",
              "Clear call-to-action",
              "Role-specific messaging"
            ]}
            gradient="from-accent/20 to-primary/20"
          />
          <FeatureCard
            icon={MessageSquare}
            title="Interview Expert Agent"
            description="Generates customized interview questions based on job requirements, helping you prepare for technical and behavioral rounds."
            features={[
              "Technical questions",
              "Behavioral questions",
              "Questions to ask",
              "Role-specific focus"
            ]}
            gradient="from-primary/20 to-accent/20"
          />
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <BenefitCard
            icon={Zap}
            title="Lightning Fast"
            description="Get results in seconds, not hours"
          />
          <BenefitCard
            icon={Target}
            title="Job-Targeted"
            description="Every output tailored to your target role"
          />
          <BenefitCard
            icon={Shield}
            title="Privacy First"
            description="Your data stays secure and private"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  features,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}) => (
  <div className="group relative rounded-2xl p-8 bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card">
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="relative">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const BenefitCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h4 className="font-display font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);
