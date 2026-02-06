import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Mail, Lock, ArrowRight, Loader2, User, Award } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isExpert, setIsExpert] = useState(searchParams.get("role") === "expert");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    // Check if user is an expert
    const { data: expertData } = await supabase
      .from("experts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (expertData) {
      navigate("/expert-dashboard");
    } else if (isExpert) {
      navigate("/expert-onboarding");
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
    setIsExpert(searchParams.get("role") === "expert");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        
        // Check role after login
        if (data.user) {
          await checkUserRole(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        
        if (isExpert && data.user) {
          toast.success("Account created! Complete your expert profile.");
          navigate("/expert-onboarding");
        } else {
          toast.success("Account created! Welcome to AgenticHire.");
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message === "User already registered") {
        toast.error("This email is already registered. Please login instead.");
      } else if (error.message === "Invalid login credentials") {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-glow opacity-40" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">
            Agentic<span className="text-gradient">Hire</span>
          </span>
        </Link>

        {/* Role Toggle */}
        {!isLogin && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsExpert(false)}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                !isExpert 
                  ? "border-primary bg-primary/10 text-foreground" 
                  : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium text-sm">I'm a Student</p>
              <p className="text-xs opacity-70">Looking for guidance</p>
            </button>
            <button
              type="button"
              onClick={() => setIsExpert(true)}
              className={`flex-1 p-4 rounded-xl border transition-all ${
                isExpert 
                  ? "border-primary bg-primary/10 text-foreground" 
                  : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Award className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium text-sm">I'm an Expert</p>
              <p className="text-xs opacity-70">Share my expertise</p>
            </button>
          </div>
        )}

        {/* Auth Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : isExpert ? "Join as Expert" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your AI career tools"
                : isExpert
                ? "Help students achieve their career goals"
                : "Start your journey to landing your dream job"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-border focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-background/50 border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-background/50 border-border focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : isExpert ? "Continue as Expert" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isLogin && (
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors block"
              >
                Forgot your password?
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Expert CTA on Login */}
        {isLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Are you an industry expert?</p>
            <Link 
              to="/auth?mode=signup&role=expert"
              className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center gap-1"
            >
              <Award className="w-4 h-4" />
              Join as an Expert
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
