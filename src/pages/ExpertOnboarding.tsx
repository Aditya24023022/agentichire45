import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, ArrowRight, Loader2, User, Mail, Phone, 
  Building, Award, Plus, X, Linkedin, Calendar 
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const expertSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  title: z.string().min(2, "Title is required"),
  company: z.string().optional(),
  years_experience: z.number().min(1, "Experience must be at least 1 year"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  calendar_link: z.string().url("Please enter a valid calendar URL").optional().or(z.literal("")),
});

const ExpertOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    company: "",
    years_experience: "",
    bio: "",
    linkedin_url: "",
    calendar_link: "",
  });
  
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login first");
      navigate("/auth?mode=signup&role=expert");
      return;
    }
    
    setUserId(session.user.id);
    setFormData(prev => ({
      ...prev,
      email: session.user.email || "",
      name: session.user.user_metadata?.full_name || "",
    }));
    
    // Check if already an expert
    const { data: existingExpert } = await supabase
      .from("experts")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (existingExpert) {
      navigate("/expert-dashboard");
      return;
    }
    
    setCheckingAuth(false);
  };

  const addSpecialization = () => {
    if (newSpec.trim() && !specializations.includes(newSpec.trim())) {
      setSpecializations([...specializations, newSpec.trim()]);
      setNewSpec("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    
    try {
      const validatedData = expertSchema.parse({
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
      });

      if (specializations.length === 0) {
        toast.error("Please add at least one specialization");
        setLoading(false);
        return;
      }

      // Create expert profile
      const { error: expertError } = await supabase.from("experts").insert({
        user_id: userId,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        title: validatedData.title,
        company: validatedData.company || null,
        years_experience: validatedData.years_experience,
        bio: validatedData.bio,
        linkedin_url: validatedData.linkedin_url || null,
        calendar_link: validatedData.calendar_link || null,
        specializations: specializations,
        available: false, // Pending approval
        price_per_session: 500,
        rating: 5.0,
        total_sessions: 0,
      });

      if (expertError) throw expertError;

      // Add expert role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "expert",
      });

      toast.success("Expert profile created! Pending admin approval.");
      navigate("/expert-dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create profile");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-40" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-glow mb-4">
            <Award className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Become an Expert
          </h1>
          <p className="text-muted-foreground">
            Share your expertise and help students achieve their career goals
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years">Years of Experience *</Label>
              <Input
                id="years"
                type="number"
                min="1"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                placeholder="5"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="pl-10"
                  placeholder="Senior Product Manager"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10"
                  placeholder="Google, Meta, etc."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specializations *</Label>
            <div className="flex gap-2">
              <Input
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                placeholder="e.g., Product Management, Data Science"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
              />
              <Button type="button" variant="outline" onClick={addSpecialization}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="px-3 py-1">
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeSpecialization(spec)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell students about your experience, expertise, and how you can help them..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 50 characters</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="pl-10"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar">Calendar Link (Calendly, etc.)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="calendar"
                  value={formData.calendar_link}
                  onChange={(e) => setFormData({ ...formData, calendar_link: e.target.value })}
                  className="pl-10"
                  placeholder="https://calendly.com/yourlink"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your profile will be reviewed by our team</li>
              <li>• Once approved, you'll appear in the Career Community</li>
              <li>• Students can message you and book sessions</li>
              <li>• You earn based on session duration</li>
            </ul>
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
                Create Expert Profile
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ExpertOnboarding;
