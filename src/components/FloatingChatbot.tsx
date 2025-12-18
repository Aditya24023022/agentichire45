import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Sparkles, X, Minimize2, Maximize2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageStyled } from "./ChatMessageStyled";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-counselor`;

// Keywords that indicate non-career topics
const NON_CAREER_KEYWORDS = [
  'recipe', 'cook', 'food', 'weather', 'movie', 'game', 'sport score', 'music lyrics', 
  'dating advice', 'relationship drama', 'politics', 'religion', 'joke tell me',
  'travel booking', 'vacation plan', 'hotel room', 'restaurant review', 
  'weight loss', 'diet plan', 'workout routine',
  'crypto trading', 'bitcoin price', 'stock tips', 'gambling', 'lottery'
];

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, education, skills, experience, career_goals")
        .eq("id", session.user.id)
        .single();
      
      if (data) {
        const profile = [
          data.full_name && `Name: ${data.full_name}`,
          data.education && `Education: ${data.education}`,
          data.skills && `Skills: ${(data.skills as string[])?.join(', ')}`,
          data.experience && `Experience: ${data.experience}`,
          data.career_goals && `Career Goals: ${data.career_goals}`,
        ].filter(Boolean).join('\n');
        setUserProfile(profile || null);
      }
    }
  };

  const isNonCareerQuery = (text: string): boolean => {
    const lower = text.toLowerCase();
    return NON_CAREER_KEYWORDS.some(keyword => lower.includes(keyword));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    
    // Check for non-career queries
    if (isNonCareerQuery(input)) {
      setMessages((prev) => [...prev, userMsg, {
        role: "assistant",
        content: "🎯 I'm your dedicated **Career Counselor**, so I can only help with career-related questions!\n\nI can assist you with:\n• Career path guidance\n• Skill development roadmaps\n• Industry insights\n• Job search strategies\n• Interview preparation tips\n\nWhat career topic would you like to explore?"
      }]);
      setInput("");
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          userProfile 
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform duration-200 animate-bounce-subtle"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 right-6 w-80' 
          : 'bottom-6 right-6 w-96 h-[520px]'
      }`}
    >
      <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Career Counselor</h3>
              <p className="text-[10px] text-muted-foreground">AI-powered guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <Bot className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">
                    Hi! I'm your AI Career Counselor.
                  </p>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <p className="bg-gradient-to-r from-emerald-500/10 to-transparent px-2 py-1.5 rounded-lg border-l-2 border-emerald-500/50">🎯 Career path suggestions</p>
                    <p className="bg-gradient-to-r from-blue-500/10 to-transparent px-2 py-1.5 rounded-lg border-l-2 border-blue-500/50">📚 Learning roadmaps</p>
                    <p className="bg-gradient-to-r from-amber-500/10 to-transparent px-2 py-1.5 rounded-lg border-l-2 border-amber-500/50">💡 Skill development</p>
                  </div>
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-[10px] text-amber-500 flex items-center gap-1 justify-center">
                      <AlertCircle className="w-3 h-3" />
                      Career topics only
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                            : "bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <ChatMessageStyled content={msg.content} isCompact={true} />
                        ) : (
                          <p className="text-xs">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-accent" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.content === "" && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-muted/50 rounded-xl px-3 py-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your career..."
                  className="flex-1 bg-background/50 text-sm h-9"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  variant="hero"
                  className="h-9 w-9 p-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingChatbot;
