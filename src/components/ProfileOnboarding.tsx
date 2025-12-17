import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, GraduationCap, Briefcase, Target, Sparkles, 
  ChevronRight, ChevronLeft, X, Plus, Loader2, CheckCircle2 
} from "lucide-react";

interface ProfileOnboardingProps {
  userId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Education", icon: GraduationCap },
  { id: 3, title: "Skills", icon: Sparkles },
  { id: 4, title: "Experience", icon: Briefcase },
  { id: 5, title: "Goals", icon: Target },
];

const ProfileOnboarding = ({ userId, onComplete, onSkip }: ProfileOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    education: "",
    skills: [] as string[],
    experience: "",
    career_goals: "",
  });

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          education: formData.education || null,
          skills: formData.skills.length > 0 ? formData.skills : null,
          experience: formData.experience || null,
          career_goals: formData.career_goals || null,
          profile_completed: true,
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Profile created! AI features are now personalized to you.");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">What's your name?</h3>
              <p className="text-sm text-muted-foreground">Let's personalize your experience</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-background/50"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Your Education</h3>
              <p className="text-sm text-muted-foreground">Tell us about your educational background</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Highest Education</Label>
              <Textarea
                id="education"
                placeholder="e.g., B.Tech in Computer Science from IIT Delhi, 2023"
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                className="bg-background/50 min-h-[100px]"
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Your Skills</h3>
              <p className="text-sm text-muted-foreground">Add your technical and soft skills</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Python, React, Leadership"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-background/50 flex-1"
                />
                <Button type="button" onClick={addSkill} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg bg-muted/30 border border-border">
                {formData.skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                ) : (
                  formData.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
              <p className="text-sm text-muted-foreground">Summarize your professional background</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Summary</Label>
              <Textarea
                id="experience"
                placeholder="e.g., 2 years as Software Developer at TCS, worked on Java backends and React frontends..."
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                className="bg-background/50 min-h-[120px]"
              />
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Career Goals</h3>
              <p className="text-sm text-muted-foreground">What do you want to achieve?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Your Career Goals</Label>
              <Textarea
                id="goals"
                placeholder="e.g., Want to become a Senior Full-Stack Developer, interested in AI/ML, planning to move to product management..."
                value={formData.career_goals}
                onChange={(e) => setFormData(prev => ({ ...prev, career_goals: e.target.value }))}
                className="bg-background/50 min-h-[120px]"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 p-6 rounded-2xl bg-card border border-border shadow-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div>
            {currentStep === 1 && onSkip && (
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                Skip for now
              </Button>
            )}
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < 5 ? (
              <Button onClick={handleNext} variant="hero">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} variant="hero" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboarding;