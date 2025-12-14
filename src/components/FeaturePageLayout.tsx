import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface FeaturePageLayoutProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export const FeaturePageLayout = ({ icon: Icon, title, description, children }: FeaturePageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {title}
                </h1>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
