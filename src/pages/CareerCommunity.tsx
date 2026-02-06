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
  Play, Pause, PhoneOff, CreditCard, QrCode, Copy, Coins,
  Phone, X, Mail
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
  name: string;
  title: string;
  company: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  rating: number | null;
  total_sessions: number | null;
  price_per_session: number;
  avatar_url: string | null;
  available: boolean | null;
  bio: string | null;
}

interface CreditPackage {
  amount: number;
  credits: number;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  { amount: 500, credits: 50 },
  { amount: 1000, credits: 110, popular: true },
  { amount: 2000, credits: 230 },
];

const UPI_ID = "adityadambale1503-1@okicici";
const CREDITS_PER_MINUTE = 0.4; // 10 credits = 25 mins, so 1 credit = 2.5 mins, 1 min = 0.4 credits

const CareerCommunity = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [inSession, setInSession] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  
  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
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
    await Promise.all([fetchExperts(), fetchUserCredits(session.user.id)]);
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

  const fetchUserCredits = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", uid)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching credits:", error);
    }
    setUserCredits(data?.credits || 0);
  };

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inSession && !isPaused) {
      interval = setInterval(() => {
        setSessionTime((prev) => {
          const creditsUsed = Math.ceil(prev / 60 * CREDITS_PER_MINUTE);
          if (creditsUsed >= userCredits) {
            endSession();
            toast.warning("Session ended - out of credits");
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inSession, isPaused, userCredits]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getMaxSessionTime = () => {
    // 10 credits = 25 minutes = 1500 seconds
    // 1 credit = 150 seconds
    return Math.floor(userCredits * 150);
  };

  const startSession = (expert: Expert) => {
    if (userCredits < 10) {
      toast.error("You need at least 10 credits to start a session");
      setShowPaymentDialog(true);
      return;
    }
    
    setSelectedExpert(expert);
    setInSession(true);
    setSessionTime(0);
    setMessages([
      { role: "system", text: `Session started with ${expert.name}` },
      { role: "expert", text: `Hi! I'm ${expert.name}. Thanks for connecting. How can I help you with your career today?` },
    ]);
    toast.success(`Session started with ${expert.name}`);
  };

  const endSession = async () => {
    // Calculate credits used
    const creditsUsed = Math.ceil(sessionTime / 60 * CREDITS_PER_MINUTE);
    
    if (userId && creditsUsed > 0) {
      const newCredits = Math.max(0, userCredits - creditsUsed);
      await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", userId);
      setUserCredits(newCredits);
    }
    
    setInSession(false);
    setIsPaused(false);
    toast.success(`Session ended. Duration: ${formatTime(sessionTime)}. Credits used: ${Math.ceil(sessionTime / 60 * CREDITS_PER_MINUTE)}`);
    setMessages([]);
    setSelectedExpert(null);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    
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

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied to clipboard");
  };

  const submitTransaction = async () => {
    if (!transactionId.trim() || !selectedPackage || !userId) {
      toast.error("Please enter a valid transaction ID");
      return;
    }

    setSubmitting(true);
    
    const { error } = await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: selectedPackage.amount,
      credits_added: selectedPackage.credits,
      transaction_id: transactionId.trim(),
      status: "pending",
    });

    if (error) {
      console.error("Error submitting transaction:", error);
      toast.error("Failed to submit transaction");
    } else {
      toast.success("Transaction submitted! Credits will be added after verification.");
      setShowPaymentDialog(false);
      setTransactionId("");
      setSelectedPackage(null);
    }
    setSubmitting(false);
  };

  const openMessageDialog = (expert: Expert) => {
    setMessageExpert(expert);
    setShowMessageDialog(true);
    setMessageText("");
  };

  const sendMessageToExpert = async () => {
    if (!messageText.trim() || !messageExpert || !userId) return;
    
    setSendingMessage(true);
    
    const { error } = await supabase.from("expert_messages").insert({
      sender_id: userId,
      receiver_id: messageExpert.id, // Using expert id as receiver for now
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
    if (userCredits < 10) {
      toast.error("You need at least 10 credits to request a call");
      setShowPaymentDialog(true);
      return;
    }
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

  const getExpertAvatar = (expert: Expert) => {
    if (expert.avatar_url) return expert.avatar_url;
    const avatars = ["👨‍💼", "👩‍💼", "👨‍💻", "👩‍🔬", "🧑‍💼"];
    return avatars[expert.name.length % avatars.length];
  };

  return (
    <FeaturePageLayout
      icon={Users}
      title="Career Counselor Community"
      description="Connect with industry experts for personalized career guidance"
    >
      {/* Credits Display */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Your Credits</p>
              <p className="text-2xl font-bold text-foreground">{userCredits}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">10 credits = 25 min session</p>
            <Button variant="hero" size="sm" onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        </div>
      </div>

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
                <p className="text-2xl font-bold text-primary">{experts.length}+</p>
                <p className="text-xs text-muted-foreground">Verified Experts</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 text-center">
                <p className="text-2xl font-bold text-accent">4.8★</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 text-center">
                <p className="text-2xl font-bold text-foreground">₹500</p>
                <p className="text-xs text-muted-foreground">50 Credits</p>
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
                          <Badge variant="default">Available</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{expert.title}</p>
                        <p className="text-xs text-primary">
                          {expert.company && `${expert.company} • `}
                          {expert.years_experience && `${expert.years_experience}+ years`}
                        </p>
                      </div>
                    </div>

                    {expert.specializations && expert.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {expert.specializations.map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
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
                          {expert.total_sessions || 0}
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
                          onClick={() => startSession(expert)}
                        >
                          Connect
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
                { icon: CreditCard, title: "Buy Credits", desc: "₹500 = 50 credits" },
                { icon: Users, title: "Choose Expert", desc: "Browse verified professionals" },
                { icon: Video, title: "Start Session", desc: "10 credits = 25 mins" },
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
                    {selectedExpert && getExpertAvatar(selectedExpert)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{selectedExpert?.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedExpert?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-500 text-sm font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(sessionTime)}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {userCredits}
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
                      {msg.role === "expert" && selectedExpert && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm flex-shrink-0">
                          {getExpertAvatar(selectedExpert)}
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
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Buy Credits
            </DialogTitle>
            <DialogDescription>
              Pay via UPI and submit your transaction ID
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Credit Packages */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Select Package</p>
              <div className="grid grid-cols-3 gap-2">
                {creditPackages.map((pkg) => (
                  <button
                    key={pkg.amount}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedPackage?.amount === pkg.amount
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="mb-1 text-[10px]" variant="default">Popular</Badge>
                    )}
                    <p className="text-lg font-bold text-foreground">₹{pkg.amount}</p>
                    <p className="text-xs text-muted-foreground">{pkg.credits} credits</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPackage && (
              <>
                {/* UPI Payment Info */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-foreground" />
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Scan QR or pay to UPI ID below
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                    <code className="flex-1 text-sm text-foreground">{UPI_ID}</code>
                    <Button size="sm" variant="ghost" onClick={copyUpiId}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-center text-lg font-bold text-primary">
                    Amount: ₹{selectedPackage.amount}
                  </p>
                </div>

                {/* Transaction ID Input */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Enter Transaction ID (after payment)
                  </p>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g., 123456789012"
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll find this in your UPI app's payment history
                  </p>
                </div>

                <Button
                  className="w-full"
                  variant="hero"
                  onClick={submitTransaction}
                  disabled={submitting || !transactionId.trim()}
                >
                  {submitting ? "Submitting..." : "Submit for Verification"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Credits will be added within 24 hours after verification
                </p>
              </>
            )}
          </div>
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
              Send a message to the expert. They will respond to your query.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {messageExpert && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {getExpertAvatar(messageExpert)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{messageExpert.name}</p>
                  <p className="text-sm text-muted-foreground">{messageExpert.title}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your message here... Ask about career advice, interview tips, or any career-related questions."
                className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <Button
              className="w-full"
              variant="hero"
              onClick={sendMessageToExpert}
              disabled={sendingMessage || !messageText.trim()}
            >
              {sendingMessage ? "Sending..." : "Send Message"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
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
              Request a video or audio call. The expert will confirm the call.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {callExpert && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  {getExpertAvatar(callExpert)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{callExpert.name}</p>
                  <p className="text-sm text-muted-foreground">{callExpert.title}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Call Type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCallType("video")}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    callType === "video"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-foreground">Video Call</p>
                </button>
                <button
                  onClick={() => setCallType("audio")}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    callType === "audio"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Phone className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-foreground">Audio Call</p>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> 10 credits = 25 minutes of session time. You have <strong>{userCredits} credits</strong>.
              </p>
            </div>

            <Button
              className="w-full"
              variant="hero"
              onClick={requestCall}
              disabled={requestingCall}
            >
              {requestingCall ? "Requesting..." : "Request Call"}
              <Phone className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </FeaturePageLayout>
  );
};

export default CareerCommunity;