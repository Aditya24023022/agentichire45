import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Star, Clock, Video, MessageSquare, Send, 
  IndianRupee, Calendar, Award, Briefcase, CheckCircle2,
  Play, Pause, Phone, PhoneOff
} from "lucide-react";
import { toast } from "sonner";

interface Expert {
  id: string;
  name: string;
  title: string;
  company: string;
  experience: string;
  specializations: string[];
  rating: number;
  sessions: number;
  pricePerSession: number;
  avatar: string;
  available: boolean;
}

const mockExperts: Expert[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    title: "Senior Engineering Manager",
    company: "Google",
    experience: "15+ years",
    specializations: ["Tech Leadership", "System Design", "Career Growth"],
    rating: 4.9,
    sessions: 234,
    pricePerSession: 500,
    avatar: "👨‍💼",
    available: true,
  },
  {
    id: "2",
    name: "Priya Sharma",
    title: "HR Director",
    company: "Microsoft",
    experience: "12+ years",
    specializations: ["Interview Prep", "Resume Building", "Salary Negotiation"],
    rating: 4.8,
    sessions: 189,
    pricePerSession: 400,
    avatar: "👩‍💼",
    available: true,
  },
  {
    id: "3",
    name: "Amit Patel",
    title: "Product Lead",
    company: "Amazon",
    experience: "10+ years",
    specializations: ["Product Management", "Career Transition", "Tech PM"],
    rating: 4.7,
    sessions: 156,
    pricePerSession: 450,
    avatar: "👨‍💻",
    available: false,
  },
  {
    id: "4",
    name: "Sneha Reddy",
    title: "Data Science Director",
    company: "Meta",
    experience: "8+ years",
    specializations: ["AI/ML Careers", "Data Science", "Research Roles"],
    rating: 4.9,
    sessions: 98,
    pricePerSession: 550,
    avatar: "👩‍🔬",
    available: true,
  },
];

const CareerCommunity = () => {
  const navigate = useNavigate();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [inSession, setInSession] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inSession && !isPaused) {
      interval = setInterval(() => {
        setSessionTime((prev) => {
          if (prev >= 1800) { // 30 minutes max
            endSession();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inSession, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startSession = (expert: Expert) => {
    setSelectedExpert(expert);
    setInSession(true);
    setSessionTime(0);
    setMessages([
      { role: "system", text: `Session started with ${expert.name}` },
      { role: "expert", text: `Hi! I'm ${expert.name}. Thanks for booking this session. How can I help you with your career today?` },
    ]);
    toast.success(`Session started with ${expert.name}`);
  };

  const endSession = () => {
    setInSession(false);
    setIsPaused(false);
    toast.success(`Session ended. Duration: ${formatTime(sessionTime)}`);
    setMessages([]);
    setSelectedExpert(null);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    
    // Simulate expert response
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me share my perspective based on my experience...",
        "I've seen this challenge before. Here's what I'd recommend...",
        "Based on what you're telling me, I think you should focus on...",
        "That's exactly the kind of strategic thinking that will help you grow. Let me elaborate...",
      ];
      setMessages((prev) => [
        ...prev,
        { role: "expert", text: responses[Math.floor(Math.random() * responses.length)] },
      ]);
    }, 1500);
  };

  return (
    <FeaturePageLayout
      icon={Users}
      title="Career Counselor Community"
      description="Connect with industry experts for personalized career guidance"
    >
      {!inSession ? (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">1-on-1 Expert Sessions</h2>
                <p className="text-muted-foreground">Get personalized advice from industry professionals</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-background/50 text-center">
                <p className="text-2xl font-bold text-primary">50+</p>
                <p className="text-xs text-muted-foreground">Verified Experts</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 text-center">
                <p className="text-2xl font-bold text-accent">4.8★</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 text-center">
                <p className="text-2xl font-bold text-foreground">30min</p>
                <p className="text-xs text-muted-foreground">Per Session</p>
              </div>
            </div>
          </div>

          {/* Demo Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-500">
              <strong>Demo Mode:</strong> This is a preview of the Career Community feature. Payment integration coming soon!
            </p>
          </div>

          {/* Experts Grid */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Available Experts
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {mockExperts.map((expert) => (
                <div
                  key={expert.id}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {expert.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{expert.name}</h4>
                        <Badge variant={expert.available ? "default" : "secondary"}>
                          {expert.available ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{expert.title}</p>
                      <p className="text-xs text-primary">{expert.company} • {expert.experience}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {expert.specializations.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {expert.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {expert.sessions} sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {expert.pricePerSession}
                      </span>
                      <Button
                        size="sm"
                        variant="hero"
                        disabled={!expert.available}
                        onClick={() => startSession(expert)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="p-6 rounded-xl bg-muted/30 border border-border">
            <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Users, title: "Choose Expert", desc: "Browse verified professionals" },
                { icon: Calendar, title: "Book Session", desc: "Pay ₹400-550 for 30 mins" },
                { icon: Video, title: "Join Call", desc: "Chat or video call" },
                { icon: CheckCircle2, title: "Get Guidance", desc: "Actionable career advice" },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Session View */
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-[600px] rounded-2xl bg-card border border-border overflow-hidden">
              {/* Session Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                    {selectedExpert?.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{selectedExpert?.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedExpert?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-500 text-sm font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(sessionTime)} / 30:00
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "expert" && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm flex-shrink-0">
                          {selectedExpert?.avatar}
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.role === "system"
                            ? "bg-muted/50 text-muted-foreground text-center w-full text-xs"
                            : "bg-muted/50 text-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your question..."
                    className="flex-1 bg-background/50"
                  />
                  <Button onClick={sendMessage} variant="hero" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Session Controls */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-card border border-border">
                <h4 className="font-semibold text-foreground mb-4">Session Controls</h4>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                    {isPaused ? "Resume" : "Pause"} Timer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={endSession}
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-muted/30 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Quick Topics</h4>
                <div className="space-y-2">
                  {["Career transition advice", "Salary negotiation tips", "Interview preparation", "Skill development roadmap"].map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(topic)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-500">
                  <strong>Demo:</strong> This is a simulated session. Real expert connections coming soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeaturePageLayout>
  );
};

export default CareerCommunity;