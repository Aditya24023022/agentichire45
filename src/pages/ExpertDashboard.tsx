import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  MessageSquare, Users, Star, Clock, Video, Send, 
  Phone, Calendar, Settings, TrendingUp,
  CheckCircle, XCircle, User, Loader2, Wifi, WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { useExpertMessages } from "@/hooks/useExpertMessages";

interface CallSession {
  id: string;
  student_id: string;
  status: string;
  call_type: string;
  created_at: string;
  duration_seconds: number | null;
}

interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  company: string | null;
  bio: string | null;
  available: boolean;
  rating: number;
  total_sessions: number;
  price_per_session: number;
  specializations: string[] | null;
}

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use the expert messages hook
  const {
    loading: messagesLoading,
    connectionStatus,
    sendMessage,
    markAsRead,
    getConversations,
    getMessagesWithPartner,
  } = useExpertMessages({
    expertId: expertProfile?.id || "",
    currentUserId: userId || "",
    isExpert: true,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    checkAuthAndFetch();
  }, []);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversation, getMessagesWithPartner]);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Check if user is an expert
    const { data: expert, error } = await supabase
      .from("experts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !expert) {
      navigate("/expert-onboarding");
      return;
    }

    setExpertProfile(expert);
    await fetchCallSessions(expert.id);
    setLoading(false);

    // Subscribe to call session updates
    const callChannel = supabase
      .channel("expert-calls")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_sessions",
          filter: `expert_id=eq.${expert.id}`,
        },
        () => {
          fetchCallSessions(expert.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
    };
  };

  const fetchCallSessions = async (expertId: string) => {
    const { data, error } = await supabase
      .from("call_sessions")
      .select("*")
      .eq("expert_id", expertId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching call sessions:", error);
    } else {
      setCallSessions(data || []);
    }
  };

  const toggleAvailability = async () => {
    if (!expertProfile) return;

    const newAvailability = !expertProfile.available;
    const { error } = await supabase
      .from("experts")
      .update({ available: newAvailability })
      .eq("id", expertProfile.id);

    if (error) {
      toast.error("Failed to update availability");
    } else {
      setExpertProfile({ ...expertProfile, available: newAvailability });
      toast.success(newAvailability ? "You're now available" : "You're now offline");
    }
  };

  const openConversation = async (partnerId: string) => {
    setSelectedConversation(partnerId);
    
    // Mark messages as read
    const messages = getMessagesWithPartner(partnerId);
    const unreadIds = messages
      .filter(m => m.receiver_id === userId && !m.is_read)
      .map(m => m.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || !expertProfile) return;

    setSending(true);
    const success = await sendMessage(replyText.trim(), selectedConversation);
    
    if (success) {
      setReplyText("");
    }
    setSending(false);
  };

  const handleCallAction = async (sessionId: string, action: "accept" | "reject") => {
    const { error } = await supabase
      .from("call_sessions")
      .update({ 
        status: action === "accept" ? "accepted" : "rejected",
        started_at: action === "accept" ? new Date().toISOString() : null,
      })
      .eq("id", sessionId);

    if (error) {
      toast.error(`Failed to ${action} call`);
    } else {
      toast.success(`Call ${action}ed`);
      if (expertProfile) fetchCallSessions(expertProfile.id);
    }
  };

  const conversations = getConversations();
  const currentMessages = selectedConversation 
    ? getMessagesWithPartner(selectedConversation) 
    : [];

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expertProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Expert Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {expertProfile.name}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <Badge 
                variant={connectionStatus === 'connected' ? "default" : "secondary"}
                className="text-xs"
              >
                {connectionStatus === 'connected' ? (
                  <><Wifi className="w-3 h-3 mr-1" /> Live</>
                ) : connectionStatus === 'connecting' ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
                )}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Available</span>
                <Switch 
                  checked={expertProfile.available} 
                  onCheckedChange={toggleAvailability}
                />
              </div>
              <Badge variant={expertProfile.available ? "default" : "secondary"}>
                {expertProfile.available ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Star, label: "Rating", value: expertProfile.rating?.toFixed(1) || "5.0", color: "text-yellow-500" },
              { icon: Video, label: "Total Sessions", value: expertProfile.total_sessions || 0, color: "text-primary" },
              { icon: MessageSquare, label: "Conversations", value: conversations.length, color: "text-blue-500" },
              { icon: TrendingUp, label: "Unread", value: totalUnread, color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="messages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="calls" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Calls
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 h-[600px]">
                {/* Conversation List */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Conversations</h3>
                  </div>
                  <ScrollArea className="h-[540px]">
                    {messagesLoading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-xs mt-1">Students will message you here</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {conversations.map(({ partnerId, lastMessage, unreadCount }) => (
                          <button
                            key={partnerId}
                            onClick={() => openConversation(partnerId)}
                            className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                              selectedConversation === partnerId ? "bg-muted/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-foreground truncate">
                                    Student
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {lastMessage.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(lastMessage.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="md:col-span-2 rounded-xl bg-card border border-border overflow-hidden flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="p-4 border-b border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Student</p>
                          <p className="text-xs text-muted-foreground">Active conversation</p>
                        </div>
                      </div>
                      
                      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                          {currentMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-xl px-4 py-2 ${
                                  msg.sender_id === userId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${msg.sender_id === userId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="p-4 border-t border-border">
                        <div className="flex gap-2">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                            disabled={sending}
                          />
                          <Button onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                            {sending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a conversation to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Calls Tab */}
            <TabsContent value="calls" className="space-y-4">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Call Requests</h3>
                </div>
                {callSessions.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No call requests yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {callSessions.map((session) => (
                      <div key={session.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Student Request</p>
                            <p className="text-sm text-muted-foreground">
                              {session.call_type} call • {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            session.status === "pending" ? "secondary" :
                            session.status === "accepted" ? "default" : "destructive"
                          }>
                            {session.status}
                          </Badge>
                          {session.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCallAction(session.id, "reject")}
                              >
                                <XCircle className="w-4 h-4 text-destructive" />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleCallAction(session.id, "accept")}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Session Scheduling</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your calendar to manage your availability
                </p>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Connect Calendar
                </Button>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Title</p>
                        <p className="text-sm text-muted-foreground">{expertProfile.title}</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Company</p>
                        <p className="text-sm text-muted-foreground">{expertProfile.company || "Not set"}</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Specializations</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {expertProfile.specializations?.map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                          )) || <span className="text-sm text-muted-foreground">Not set</span>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">New Messages</p>
                        <p className="text-sm text-muted-foreground">Get notified when students message you</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Call Requests</p>
                        <p className="text-sm text-muted-foreground">Get notified for new call requests</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ExpertDashboard;
