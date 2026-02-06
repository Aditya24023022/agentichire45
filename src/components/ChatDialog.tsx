import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, User, Loader2, Wifi, WifiOff } from "lucide-react";
import { useExpertMessages, Message } from "@/hooks/useExpertMessages";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expertId: string;
  expertName: string;
  expertUserId: string;
  currentUserId: string;
  isExpert?: boolean;
  partnerName?: string;
  partnerId?: string;
}

export const ChatDialog = ({
  open,
  onOpenChange,
  expertId,
  expertName,
  expertUserId,
  currentUserId,
  isExpert = false,
  partnerName,
  partnerId,
}: ChatDialogProps) => {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    connectionStatus,
    sendMessage,
    markAsRead,
    getMessagesWithPartner,
  } = useExpertMessages({
    expertId,
    currentUserId,
    isExpert,
  });

  // Get messages for this conversation
  const conversationMessages = isExpert && partnerId
    ? getMessagesWithPartner(partnerId)
    : messages;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  // Mark unread messages as read when dialog opens
  useEffect(() => {
    if (open && conversationMessages.length > 0) {
      const unreadIds = conversationMessages
        .filter((m) => !m.is_read && m.receiver_id === currentUserId)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [open, conversationMessages, currentUserId, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    const receiverId = isExpert && partnerId ? partnerId : expertUserId;
    const success = await sendMessage(messageText, receiverId);
    
    if (success) {
      setMessageText("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = isExpert ? (partnerName || "Student") : expertName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {isExpert ? "Student" : "Expert"}
                </p>
              </div>
            </div>
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
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <User className="w-12 h-12 mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversationMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={sending || !messageText.trim()}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2 ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {time}
        </p>
      </div>
    </div>
  );
};
