import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  expert_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface UseExpertMessagesOptions {
  expertId: string;
  currentUserId: string;
  isExpert?: boolean;
}

export const useExpertMessages = ({ expertId, currentUserId, isExpert = false }: UseExpertMessagesOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Fetch profile for a user ID
  const fetchProfile = useCallback(async (userId: string) => {
    if (profiles.has(userId)) return profiles.get(userId);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfiles(prev => new Map(prev).set(userId, data));
      return data;
    }
    return null;
  }, [profiles]);

  // Fetch all messages for this expert conversation
  const fetchMessages = useCallback(async () => {
    if (!expertId || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("expert_messages")
        .select("*")
        .eq("expert_id", expertId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for all unique sender IDs
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      for (const senderId of senderIds) {
        await fetchProfile(senderId);
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [expertId, currentUserId, fetchProfile]);

  // Set up realtime subscription
  useEffect(() => {
    if (!expertId || !currentUserId) return;

    fetchMessages();
    setConnectionStatus('connecting');

    const channelName = `expert-chat-${expertId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expert_messages",
          filter: `expert_id=eq.${expertId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as Message;
          
          // Fetch profile for new sender if not already cached
          await fetchProfile(newMessage.sender_id);
          
          // Deduplicate - only add if not already in messages
          setMessages((current) => {
            if (current.some(m => m.id === newMessage.id)) {
              return current;
            }
            return [...current, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });

          // Show toast for incoming messages (not sent by current user)
          if (newMessage.sender_id !== currentUserId) {
            const profile = profiles.get(newMessage.sender_id);
            const name = profile?.full_name || "Someone";
            toast.info(`New message from ${name}!`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "expert_messages",
          filter: `expert_id=eq.${expertId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((current) =>
            current.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .subscribe((status, err) => {
        console.log("Subscription status:", status, err);
        if (status === "SUBSCRIBED") {
          setConnectionStatus('connected');
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus('disconnected');
          // Auto-retry after 3 seconds
          setTimeout(() => {
            channel.subscribe();
          }, 3000);
        } else if (status === "CLOSED") {
          setConnectionStatus('disconnected');
        }
      });

    // Polling fallback every 10 seconds
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [expertId, currentUserId, fetchMessages]);

  // Send a message
  const sendMessage = async (messageText: string, receiverId: string) => {
    if (!messageText.trim() || !currentUserId || !expertId) return false;

    const { error } = await supabase.from("expert_messages").insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      expert_id: expertId,
      message: messageText.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    }

    return true;
  };

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    await supabase
      .from("expert_messages")
      .update({ is_read: true })
      .in("id", messageIds)
      .eq("receiver_id", currentUserId);
  };

  // Get sender name from profile
  const getSenderName = useCallback((senderId: string, fallback: string = "User") => {
    const profile = profiles.get(senderId);
    return profile?.full_name || profile?.email?.split("@")[0] || fallback;
  }, [profiles]);

  // Get unique conversations (for expert dashboard)
  const getConversations = useCallback(() => {
    const conversationMap = new Map<string, { partnerId: string; partnerName: string; lastMessage: Message; unreadCount: number }>();
    
    messages.forEach((msg) => {
      const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      const existing = conversationMap.get(partnerId);
      
      const unreadCount = !msg.is_read && msg.receiver_id === currentUserId ? 1 : 0;
      const partnerName = getSenderName(partnerId, "Student");
      
      if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + unreadCount,
        });
      } else if (unreadCount > 0) {
        conversationMap.set(partnerId, {
          ...existing,
          unreadCount: existing.unreadCount + unreadCount,
        });
      }
    });

    return Array.from(conversationMap.values());
  }, [messages, currentUserId, getSenderName]);

  // Get messages for a specific conversation partner
  const getMessagesWithPartner = useCallback((partnerId: string) => {
    return messages.filter(
      (msg) =>
        (msg.sender_id === partnerId || msg.receiver_id === partnerId)
    );
  }, [messages]);

  return {
    messages,
    profiles,
    loading,
    connectionStatus,
    sendMessage,
    markAsRead,
    getConversations,
    getMessagesWithPartner,
    getSenderName,
    refetch: fetchMessages,
  };
};
