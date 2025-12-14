import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              Agentic<span className="text-gradient">Hire</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/resume-optimizer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Resume
                </Link>
                <Link to="/email-writer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Email Writer
                </Link>
                <Link to="/interview-prep" className="text-muted-foreground hover:text-foreground transition-colors">
                  Interview Prep
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Button asChild variant="hero" size="sm">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/resume-optimizer" className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors">
                    Resume Optimizer
                  </Link>
                  <Link to="/email-writer" className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors">
                    Email Writer
                  </Link>
                  <Link to="/interview-prep" className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors">
                    Interview Prep
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-left text-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors">
                    Login
                  </Link>
                  <Link to="/auth?mode=signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-center">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
