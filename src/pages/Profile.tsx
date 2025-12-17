import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, History, Briefcase, Video, Save, Loader2, FileText, Mail, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  education: string | null;
  skills: string[] | null;
  experience: string | null;
  career_goals: string | null;
  profile_completed: boolean | null;
}

interface Generation {
  id: string;
  type: string;
  created_at: string;
  output_content: string | null;
}

interface SavedJob {
  id: string;
  job_title: string | null;
  company_name: string | null;
  job_url: string | null;
  created_at: string;
}

interface InterviewSession {
  id: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  resume: FileText,
  coverLetter: FileText,
  email: Mail,
  interview: MessageSquare,
  ats: FileText,
  linkedin: User,
  skillsGap: FileText,
  salary: FileText,
  followUp: Mail,
  jobMatch: Briefcase,
  portfolio: FileText,
  networking: MessageSquare,
  career: FileText,
};

const typeLabels: Record<string, string> = {
  resume: "Resume Optimization",
  coverLetter: "Cover Letter",
  email: "HR Email",
  interview: "Interview Prep",
  ats: "ATS Analysis",
  linkedin: "LinkedIn Optimization",
  skillsGap: "Skills Gap Analysis",
  salary: "Salary Coaching",
  followUp: "Follow-up Email",
  jobMatch: "Job Match",
  portfolio: "Portfolio Description",
  networking: "Networking Message",
  career: "Career Advice",
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load generations (history)
      const { data: genData } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (genData) {
        setGenerations(genData);
      }

      // Load saved jobs
      const { data: jobsData } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (jobsData) {
        setSavedJobs(jobsData);
      }

      // Load interview sessions
      const { data: interviewData } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (interviewData) {
        setInterviews(interviewData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          linkedin_url: profile.linkedin_url,
          portfolio_url: profile.portfolio_url,
          education: profile.education,
          skills: profile.skills,
          experience: profile.experience,
          career_goals: profile.career_goals,
          profile_completed: true,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <FeaturePageLayout icon={User} title="Profile" description="Your profile and history">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </FeaturePageLayout>
    );
  }

  return (
    <FeaturePageLayout icon={User} title="Profile" description="Manage your profile and view your history">
      <Tabs defaultValue="profile" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Generations
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Saved Jobs
          </TabsTrigger>
          <TabsTrigger value="interviews" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Interviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-border space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile?.full_name || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-background/50 opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile?.phone || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={profile?.linkedin_url || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="portfolio">Portfolio URL</Label>
                <Input
                  id="portfolio"
                  value={profile?.portfolio_url || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, portfolio_url: e.target.value } : null)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Extended Profile Fields */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Career Information (Used for AI Personalization)
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    placeholder="e.g., B.Tech Computer Science from IIT Delhi"
                    value={profile?.education || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, education: e.target.value } : null)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="e.g., Python, React, Machine Learning, Leadership"
                    value={profile?.skills?.join(", ") || ""}
                    onChange={(e) => setProfile(prev => prev ? { 
                      ...prev, 
                      skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                    } : null)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Summary</Label>
                  <Input
                    id="experience"
                    placeholder="e.g., 3 years as Software Developer at TCS"
                    value={profile?.experience || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, experience: e.target.value } : null)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals">Career Goals</Label>
                  <Input
                    id="goals"
                    placeholder="e.g., Transition to Senior Full-Stack Developer role"
                    value={profile?.career_goals || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, career_goals: e.target.value } : null)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </div>

            <Button onClick={saveProfile} disabled={saving} variant="hero">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {generations.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-card border border-border">
              <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No generations yet</p>
            </div>
          ) : (
            generations.map((gen) => {
              const Icon = typeIcons[gen.type] || FileText;
              return (
                <div key={gen.id} className="p-4 rounded-xl bg-card border border-border flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{typeLabels[gen.type] || gen.type}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(gen.created_at)}
                      </span>
                    </div>
                    {gen.output_content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {gen.output_content.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-card border border-border">
              <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No saved jobs yet</p>
            </div>
          ) : (
            savedJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground block">{job.job_title || "Untitled"}</span>
                  <span className="text-sm text-muted-foreground">{job.company_name || "Unknown Company"}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4">
          {interviews.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-card border border-border">
              <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No mock interviews yet</p>
            </div>
          ) : (
            interviews.map((interview) => (
              <div key={interview.id} className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Mock Interview</span>
                    {interview.score && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        interview.score >= 70 ? 'bg-green-500/20 text-green-400' :
                        interview.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Score: {interview.score}%
                      </span>
                    )}
                  </div>
                  {interview.feedback && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{interview.feedback}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(interview.created_at)}</span>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </FeaturePageLayout>
  );
};

export default Profile;
