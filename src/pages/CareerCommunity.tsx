import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Star, Video, MessageSquare, Send, 
  Calendar, Award, Briefcase, CheckCircle2,
  Phone, X, Linkedin, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Expert {
  id: string;
  user_id: string | null;
  name: string;
  title: string;
  company: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  rating: number | null;
  total_sessions: number | null;
  avatar_url: string | null;
  available: boolean | null;
  bio: string | null;
  linkedin_url: string | null;
  calendar_link: string | null;
}

const CareerCommunity = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  
  // Messaging dialog
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageExpert, setMessageExpert] = useState<Expert | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Call request dialog
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callExpert, setCallExpert] = useState<Expert | null>(null);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [requestingCall, setRequestingCall] = useState(false);

  // Expert detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // User state
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    await fetchExperts();
  };

  const fetchExperts = async () => {
    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .eq("available", true);
    
    if (error) {
      console.error("Error fetching experts:", error);
      toast.error("Failed to load experts");
    } else {
      setExperts(data || []);
    }
    setLoading(false);
  };

  const getExpertAvatar = (expert: Expert) => {
    if (expert.avatar_url) return expert.avatar_url;
    const avatars = ["👨‍💼", "👩‍💼", "👨‍💻", "👩‍🔬", "🧑‍💼"];
    return avatars[expert.name.length % avatars.length];
  };

  const openMessageDialog = (expert: Expert) => {
    setMessageExpert(expert);
    setShowMessageDialog(true);
    setMessageText("");
  };

  const sendMessageToExpert = async () => {
    if (!messageText.trim() || !messageExpert || !userId) return;
    
    setSendingMessage(true);
    
    // Send to expert's user_id if available
    const receiverId = messageExpert.user_id || messageExpert.id;
    
    const { error } = await supabase.from("expert_messages").insert({
      sender_id: userId,
      receiver_id: receiverId,
      expert_id: messageExpert.id,
      message: messageText.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      toast.success(`Message sent to ${messageExpert.name}!`);
      setShowMessageDialog(false);
      setMessageText("");
      setMessageExpert(null);
    }
    setSendingMessage(false);
  };

  const openCallDialog = (expert: Expert) => {
    setCallExpert(expert);
    setShowCallDialog(true);
  };

  const requestCall = async () => {
    if (!callExpert || !userId) return;
    
    setRequestingCall(true);
    
    const { error } = await supabase.from("call_sessions").insert({
      student_id: userId,
      expert_id: callExpert.id,
      call_type: callType,
      status: "pending",
    });

    if (error) {
      console.error("Error requesting call:", error);
      toast.error("Failed to request call");
    } else {
      toast.success(`Call request sent to ${callExpert.name}! They will respond soon.`);
      setShowCallDialog(false);
      setCallExpert(null);
    }
    setRequestingCall(false);
  };

  const openExpertDetail = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowDetailDialog(true);
  };

  return (
    <FeaturePageLayout
      icon={Users}
      title="Career Counselor Community"
      description="Connect with industry experts for personalized career guidance"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Connect with Industry Experts</h2>
              <p className="text-muted-foreground">Get personalized advice from professionals in your field</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-background/50 text-center">
              <p className="text-2xl font-bold text-primary">{experts.length}+</p>
              <p className="text-xs text-muted-foreground">Available Experts</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 text-center">
              <p className="text-2xl font-bold text-accent">Free</p>
              <p className="text-xs text-muted-foreground">Messaging</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 text-center">
              <p className="text-2xl font-bold text-foreground">1:1</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>

        {/* Experts Grid */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Available Experts
          </h3>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading experts...</div>
          ) : experts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No experts available yet. Check back soon!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Are you an industry expert? <a href="/expert-onboarding" className="text-primary hover:underline">Join as an expert</a>
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {experts.map((expert) => (
                <div
                  key={expert.id}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {getExpertAvatar(expert)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{expert.name}</h4>
                        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                          Available
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{expert.title}</p>
                      <p className="text-xs text-primary">
                        {expert.company && `${expert.company} • `}
                        {expert.years_experience && `${expert.years_experience}+ years`}
                      </p>
                    </div>
                  </div>

                  {expert.bio && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{expert.bio}</p>
                  )}

                  {expert.specializations && expert.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {expert.specializations.slice(0, 4).map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {expert.specializations.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.specializations.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {expert.rating || 5.0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {expert.total_sessions || 0} sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMessageDialog(expert)}
                        title="Send Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCallDialog(expert)}
                        title="Request Call"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="hero"
                        onClick={() => openExpertDetail(expert)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="p-6 rounded-xl bg-muted/30 border border-border">
          <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Users, title: "Browse Experts", desc: "Find professionals in your field" },
              { icon: MessageSquare, title: "Send Message", desc: "Introduce yourself" },
              { icon: Calendar, title: "Schedule Call", desc: "Book a 1:1 session" },
              { icon: CheckCircle2, title: "Get Guidance", desc: "Receive career advice" },
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

        {/* CTA for experts */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-center">
          <Award className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Are you an industry expert?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share your knowledge and help students achieve their career goals
          </p>
          <Button variant="hero" onClick={() => navigate("/expert-onboarding")}>
            Join as Expert
          </Button>
        </div>
      </div>

      {/* Expert Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                {selectedExpert && getExpertAvatar(selectedExpert)}
              </div>
              <div>
                <p>{selectedExpert?.name}</p>
                <p className="text-sm font-normal text-muted-foreground">{selectedExpert?.title}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedExpert && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedExpert.company && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {selectedExpert.company}
                  </span>
                )}
                {selectedExpert.years_experience && (
                  <span>{selectedExpert.years_experience}+ years exp</span>
                )}
              </div>

              {selectedExpert.bio && (
                <p className="text-sm text-foreground">{selectedExpert.bio}</p>
              )}

              {selectedExpert.specializations && selectedExpert.specializations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.specializations.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {selectedExpert.rating || 5.0} rating
                </span>
                <span className="text-muted-foreground">
                  {selectedExpert.total_sessions || 0} sessions completed
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedExpert.linkedin_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedExpert.linkedin_url!, "_blank")}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {selectedExpert.calendar_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedExpert.calendar_link!, "_blank")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book via Calendly
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowDetailDialog(false);
                    openMessageDialog(selectedExpert);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  className="flex-1"
                  variant="hero"
                  onClick={() => {
                    setShowDetailDialog(false);
                    openCallDialog(selectedExpert);
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Request Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Message {messageExpert?.name}
            </DialogTitle>
            <DialogDescription>
              Introduce yourself and explain how they can help you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi! I'm interested in learning more about your experience in..."
              rows={5}
              className="bg-background"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMessageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={sendMessageToExpert}
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Request Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Request Call with {callExpert?.name}
            </DialogTitle>
            <DialogDescription>
              Choose your preferred call type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCallType("video")}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  callType === "video"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Video className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-foreground">Video Call</p>
                <p className="text-xs text-muted-foreground">Face-to-face session</p>
              </button>
              <button
                onClick={() => setCallType("audio")}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  callType === "audio"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Phone className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-foreground">Audio Call</p>
                <p className="text-xs text-muted-foreground">Voice-only session</p>
              </button>
            </div>

            {callExpert?.calendar_link && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  This expert has a calendar link for scheduling
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(callExpert.calendar_link!, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Calendar
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCallDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={requestCall}
                disabled={requestingCall}
              >
                {requestingCall ? "Requesting..." : "Send Request"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              The expert will receive your request and respond soon
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </FeaturePageLayout>
  );
};

export default CareerCommunity;
