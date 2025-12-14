import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-12 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">
              AgenticHire
            </span>
          </Link>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgenticHire. AI-powered career enhancement.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/auth?mode=signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
