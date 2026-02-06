import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageSquare, User, Loader2, Phone, Video, Clock } from "lucide-react";
import { ChatDialog } from "./ChatDialog";

interface Expert {
  id: string;
  user_id: string | null;
  name: string;
  title: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  expert_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface CallSession {
  id: string;
  expert_id: string;
  student_id: string;
  call_type: string;
  status: string;
  created_at: string;
}

interface StudentInboxProps {
  userId: string;
}

export const StudentInbox = ({ userId }: StudentInboxProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Map<string, { expert: Expert; messages: Message[]; unreadCount: number }>>(new Map());
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [experts, setExperts] = useState<Map<string, Expert>>(new Map());
  
  // Chat dialog state
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all messages where user is sender or receiver
    const { data: messages } = await supabase
      .from("expert_messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    // Fetch call sessions
    const { data: calls } = await supabase
      .from("call_sessions")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    // Get unique expert IDs
    const expertIds = new Set<string>();
    messages?.forEach((m) => expertIds.add(m.expert_id));
    calls?.forEach((c) => expertIds.add(c.expert_id));

    // Fetch expert details
    if (expertIds.size > 0) {
      const { data: expertData } = await supabase
        .from("experts")
        .select("id, user_id, name, title")
        .in("id", Array.from(expertIds));

      const expertsMap = new Map<string, Expert>();
      expertData?.forEach((e) => expertsMap.set(e.id, e));
      setExperts(expertsMap);

      // Group messages by expert
      const convMap = new Map<string, { expert: Expert; messages: Message[]; unreadCount: number }>();
      messages?.forEach((msg) => {
        const expert = expertsMap.get(msg.expert_id);
        if (!expert) return;

        const existing = convMap.get(msg.expert_id);
        const isUnread = !msg.is_read && msg.receiver_id === userId;

        if (existing) {
          existing.messages.push(msg);
          if (isUnread) existing.unreadCount++;
        } else {
          convMap.set(msg.expert_id, {
            expert,
            messages: [msg],
            unreadCount: isUnread ? 1 : 0,
          });
        }
      });

      setConversations(convMap);
    }

    setCallSessions(calls || []);
    setLoading(false);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!open || !userId) return;

    const channel = supabase
      .channel("student-inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expert_messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_sessions",
          filter: `student_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, userId]);

  const totalUnread = Array.from(conversations.values()).reduce((sum, c) => sum + c.unreadCount, 0);

  const openChat = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowChatDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-500";
      case "accepted": return "bg-green-500/20 text-green-500";
      case "rejected": return "bg-red-500/20 text-red-500";
      case "completed": return "bg-blue-500/20 text-blue-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <MessageSquare className="w-4 h-4 mr-2" />
            My Inbox
            {totalUnread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {totalUnread}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              My Inbox
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Messages Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Messages</h3>
                {conversations.size === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {Array.from(conversations.values()).map(({ expert, messages, unreadCount }) => (
                        <button
                          key={expert.id}
                          onClick={() => openChat(expert)}
                          className="w-full p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-foreground truncate">{expert.name}</p>
                                {unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {messages[0]?.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Call Requests Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Call Requests</h3>
                {callSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No call requests yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {callSessions.map((call) => {
                        const expert = experts.get(call.expert_id);
                        return (
                          <div
                            key={call.id}
                            className="p-3 rounded-lg bg-card border border-border"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  {call.call_type === "video" ? (
                                    <Video className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Phone className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {expert?.name || "Expert"}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(call.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(call.status)}>
                                {call.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Chat Dialog */}
      {selectedExpert && (
        <ChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          expertId={selectedExpert.id}
          expertName={selectedExpert.name}
          expertUserId={selectedExpert.user_id || selectedExpert.id}
          currentUserId={userId}
          isExpert={false}
        />
      )}
    </>
  );
};
