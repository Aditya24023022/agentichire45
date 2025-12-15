import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Volume2 } from 'lucide-react';
import interviewerAvatar from '@/assets/interviewer-avatar.png';

interface AIInterviewerProps {
  jobDescription: string;
  resumeContent: string;
  onInterviewComplete: (data: {
    score: number;
    feedback: string;
    responses: string[];
    questions: string[];
    duration: number;
  }) => void;
}

const AIInterviewer: React.FC<AIInterviewerProps> = ({
  jobDescription,
  resumeContent,
  onInterviewComplete
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{ speaker: 'agent' | 'user'; text: string }[]>([]);
  const startTimeRef = useRef<number>(0);
  const questionsRef = useRef<string[]>([]);
  const responsesRef = useRef<string[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsActive(true);
      setIsConnecting(false);
      startTimeRef.current = Date.now();
      toast.success('Interview started! Just speak naturally.');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      if (isActive) {
        completeInterview();
      }
      setIsActive(false);
    },
    onMessage: (message: any) => {
      console.log('Message received:', message);
      
      // Handle user transcription
      if (message.user_transcript) {
        const userText = message.user_transcript;
        responsesRef.current.push(userText);
        setTranscript(prev => [...prev, { speaker: 'user', text: userText }]);
      }
      
      // Handle agent response
      if (message.agent_response) {
        const agentText = message.agent_response;
        questionsRef.current.push(agentText);
        setTranscript(prev => [...prev, { speaker: 'agent', text: agentText }]);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast.error('Connection error. Please try again.');
      setIsConnecting(false);
      setIsActive(false);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const completeInterview = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score = Math.min(95, 60 + Math.floor(responsesRef.current.length * 5));
    
    let feedback = "Thank you for completing the interview. ";
    if (score >= 80) {
      feedback += "Your communication was clear and confident. You provided thoughtful responses with good examples. Keep practicing to maintain this level!";
    } else if (score >= 65) {
      feedback += "You showed solid communication skills. Consider providing more specific examples in your answers and work on being more concise.";
    } else {
      feedback += "You showed potential in this interview. Focus on structuring your answers better and practice speaking more confidently.";
    }

    onInterviewComplete({
      score,
      feedback,
      responses: responsesRef.current,
      questions: questionsRef.current,
      duration
    });
  };

  const startInterview = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation', {
        body: { 
          action: 'get-token',
          jobDescription,
          resumeContent
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to connect to interview agent');
      }
      
      if (!data?.signed_url) {
        console.error('No signed URL received:', data);
        throw new Error('Failed to get interview session');
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
      
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      toast.error(error.message || 'Failed to start interview. Please check your microphone permissions.');
      setIsConnecting(false);
    }
  }, [conversation, jobDescription, resumeContent]);

  const endInterview = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Auto-start the interview when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startInterview();
    }, 1500);
    
    return () => {
      clearTimeout(timer);
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center min-h-[70vh] bg-gradient-to-b from-background to-muted/20 rounded-2xl p-6">
      {/* Avatar Section */}
      <div className="relative mb-6">
        <div 
          className={`w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 transition-all duration-300 ${
            conversation.isSpeaking 
              ? 'border-primary shadow-xl shadow-primary/40' 
              : isActive 
                ? 'border-green-500 shadow-lg shadow-green-500/20' 
                : 'border-muted'
          }`}
        >
          <img 
            src={interviewerAvatar} 
            alt="Priya - HR Interviewer"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              conversation.isSpeaking ? 'scale-105' : ''
            }`}
          />
        </div>
        
        {/* Speaking Indicator - Sound waves animation */}
        {conversation.isSpeaking && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex items-end gap-0.5 h-6 px-3 py-1 bg-primary/90 rounded-full">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-white rounded-full animate-pulse"
                style={{ 
                  height: `${8 + Math.sin(i * 0.8) * 8}px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: '0.4s'
                }}
              />
            ))}
          </div>
        )}
        
        {/* Listening Indicator */}
        {isActive && !conversation.isSpeaking && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Listening...
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-foreground mb-1">Priya</h2>
        <p className="text-muted-foreground text-sm">Senior HR Professional</p>
        
        {isConnecting && (
          <div className="flex items-center justify-center gap-2 mt-4 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to interview...</span>
          </div>
        )}
        
        {isActive && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Volume2 className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-500 font-medium">
              Interview in progress
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isActive && (
        <p className="text-center text-muted-foreground text-sm mb-4 max-w-md">
          Just speak naturally when responding. No buttons needed - I'm listening automatically.
        </p>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-2xl bg-card/60 backdrop-blur border border-border rounded-xl p-4 max-h-72 overflow-y-auto mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Conversation
          </h3>
          <div className="space-y-3">
            {transcript.map((entry, index) => (
              <div 
                key={index}
                className={`flex gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div 
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    entry.speaker === 'agent' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-accent/20 text-accent-foreground'
                  }`}
                >
                  {entry.speaker === 'agent' ? 'P' : 'You'}
                </div>
                <div 
                  className={`flex-1 p-3 rounded-xl text-sm ${
                    entry.speaker === 'agent' 
                      ? 'bg-primary/10 text-foreground' 
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* End Interview Button - Only show when active */}
      {isActive && (
        <button
          onClick={endInterview}
          className="px-6 py-2.5 bg-destructive/90 text-destructive-foreground rounded-lg hover:bg-destructive transition-colors font-medium text-sm"
        >
          End Interview
        </button>
      )}

      {/* Initial Instructions */}
      {!isActive && !isConnecting && (
        <div className="text-center text-muted-foreground mt-4 space-y-2">
          <p className="text-sm">Please allow microphone access when prompted.</p>
          <p className="text-sm">The interview will begin automatically.</p>
          <button
            onClick={startInterview}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Start Interview
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInterviewer;
