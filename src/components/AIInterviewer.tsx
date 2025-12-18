import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Volume2, Mic, MicOff, AlertCircle } from 'lucide-react';
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
  interviewType?: 'hr' | 'technical';
}

const AIInterviewer: React.FC<AIInterviewerProps> = ({
  jobDescription,
  resumeContent,
  onInterviewComplete,
  interviewType = 'hr'
}) => {
  const isHR = interviewType === 'hr';
  const interviewerName = isHR ? 'Priya' : 'Arjun';
  const interviewerTitle = isHR ? 'Senior HR Professional' : 'Technical Lead';
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ speaker: 'agent' | 'user'; text: string }[]>([]);
  
  const startTimeRef = useRef<number>(0);
  const questionsRef = useRef<string[]>([]);
  const responsesRef = useRef<string[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const retryCountRef = useRef(0);

  const safeCompleteInterview = useCallback(() => {
    if (completedRef.current) return;
    if (!startTimeRef.current) {
      // No interview was started
      return;
    }

    completedRef.current = true;

    const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const answered = responsesRef.current.length;
    const totalQuestions = questionsRef.current.length;

    // Calculate score based on responses
    let baseScore = 50;
    if (answered > 0) {
      // Add points for each answer
      baseScore += answered * 7;
      
      // Add points for response quality (length as proxy)
      const avgLength = responsesRef.current.reduce((acc, r) => acc + (r?.length || 0), 0) / answered;
      if (avgLength > 100) baseScore += 10;
      if (avgLength > 200) baseScore += 5;
    }
    
    const score = Math.min(95, Math.max(35, baseScore));

    let feedback = "Thank you for completing the interview. ";
    if (score >= 80) {
      feedback += "Excellent performance! Your responses were detailed and well-structured.";
    } else if (score >= 65) {
      feedback += "Good effort! Consider providing more specific examples in your answers.";
    } else {
      feedback += "Keep practicing! Focus on using the STAR method and providing concrete examples.";
    }

    onInterviewComplete({
      score,
      feedback,
      responses: responsesRef.current,
      questions: questionsRef.current,
      duration,
    });
  }, [onInterviewComplete]);

  const pushTranscript = useCallback((speaker: 'agent' | 'user', text: string) => {
    const t = (text || '').trim();
    if (!t) return;
    setTranscript((prev) => {
      // Avoid duplicates
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && lastEntry.speaker === speaker && lastEntry.text === t) {
        return prev;
      }
      return [...prev, { speaker, text: t }];
    });
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsActive(true);
      setIsConnecting(false);
      setConnectionError(null);
      completedRef.current = false;
      startTimeRef.current = Date.now();
      questionsRef.current = [];
      responsesRef.current = [];
      setTranscript([]);
      toast.success('Interview started! Speak naturally to respond.');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      setIsActive(false);
      // Only complete if we actually had an interview
      if (startTimeRef.current && !completedRef.current) {
        safeCompleteInterview();
      }
    },
    onMessage: (message: any) => {
      console.log('ElevenLabs message:', JSON.stringify(message, null, 2));

      // Handle various message formats from ElevenLabs SDK
      // User transcript events
      if (message?.type === 'user_transcript' || message?.user_transcript) {
        const userText = message?.user_transcript || 
                        message?.user_transcription_event?.user_transcript ||
                        message?.text;
        if (userText && typeof userText === 'string') {
          responsesRef.current.push(userText.trim());
          pushTranscript('user', userText);
        }
      }
      
      // Agent response events
      if (message?.type === 'agent_response' || message?.agent_response) {
        const agentText = message?.agent_response ||
                         message?.agent_response_event?.agent_response ||
                         message?.text;
        if (agentText && typeof agentText === 'string') {
          questionsRef.current.push(agentText.trim());
          pushTranscript('agent', agentText);
        }
      }

      // Handle role-based messages
      if (message?.role === 'user' && message?.message) {
        responsesRef.current.push(message.message.trim());
        pushTranscript('user', message.message);
      }
      if ((message?.role === 'agent' || message?.role === 'assistant') && message?.message) {
        questionsRef.current.push(message.message.trim());
        pushTranscript('agent', message.message);
      }

      // Handle transcript type messages
      if (message?.type === 'transcript' && message?.text) {
        const speaker = message?.source === 'user' ? 'user' : 'agent';
        if (speaker === 'user') {
          responsesRef.current.push(message.text.trim());
        } else {
          questionsRef.current.push(message.text.trim());
        }
        pushTranscript(speaker, message.text);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setConnectionError('Connection error occurred');
      toast.error('Interview connection issue. Please try again.');
      setIsConnecting(false);
      setIsActive(false);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startInterview = useCallback(async () => {
    if (isConnecting || isActive) return;
    
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Request microphone permission (no camera)
      console.log('Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Microphone access granted');

      // Get signed URL from backend function
      console.log('Fetching signed URL from backend...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation', {
        body: {
          action: 'get-token',
          jobDescription,
          resumeContent,
          interviewType,
        },
      });

      if (error) {
        console.error('Backend function error:', error);
        throw new Error('Failed to connect to interview service');
      }

      console.log('Backend response:', data);

      if (!data?.signed_url) {
        console.error('No signed URL in response:', data);
        throw new Error('Interview service unavailable');
      }

      // Start the conversation with WebSocket
      console.log('Starting WebSocket conversation...');
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
      
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      setConnectionError(error.message || 'Failed to start interview');
      
      if (error.name === 'NotAllowedError' || error.message?.includes('microphone')) {
        toast.error('Please allow microphone access to start the interview.');
      } else {
        toast.error(error.message || 'Failed to start interview. Please try again.');
      }
      setIsConnecting(false);
    }
  }, [conversation, jobDescription, resumeContent, interviewType, isConnecting, isActive]);

  const endInterview = useCallback(async () => {
    console.log('Ending interview...');
    try {
      await conversation.endSession();
    } catch (e) {
      console.error('Error ending session:', e);
    }
    safeCompleteInterview();
  }, [conversation, safeCompleteInterview]);

  // Auto-start the interview when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnecting && !isActive && !completedRef.current) {
        startInterview();
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (conversation.status === 'connected') {
        conversation.endSession().catch(console.error);
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
              ? 'border-primary shadow-xl shadow-primary/40 animate-pulse' 
              : isActive 
                ? 'border-green-500 shadow-lg shadow-green-500/20' 
                : 'border-muted'
          }`}
        >
          {isHR ? (
            <img 
              src={interviewerAvatar} 
              alt={`${interviewerName} - ${interviewerTitle}`}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                conversation.isSpeaking ? 'scale-105' : ''
              }`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-6xl transition-transform duration-300 ${
              conversation.isSpeaking ? 'scale-105' : ''
            }`}>
              👨‍💻
            </div>
          )}
        </div>
        
        {/* Speaking Indicator */}
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
              <Mic className="w-4 h-4 animate-pulse" />
              Listening...
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-foreground mb-1">{interviewerName}</h2>
        <p className="text-muted-foreground text-sm">{interviewerTitle}</p>
        
        {isConnecting && (
          <div className="flex items-center justify-center gap-2 mt-4 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to {interviewerName}...</span>
          </div>
        )}
        
        {connectionError && (
          <div className="flex items-center justify-center gap-2 mt-4 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{connectionError}</span>
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
          Just speak naturally when responding. {interviewerName} is listening automatically - no buttons needed!
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
                  {entry.speaker === 'agent' ? interviewerName[0] : 'You'}
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
          End Interview & Get Report
        </button>
      )}

      {/* Initial Instructions / Retry */}
      {!isActive && !isConnecting && (
        <div className="text-center text-muted-foreground mt-4 space-y-3">
          {connectionError ? (
            <>
              <p className="text-sm">Having trouble connecting?</p>
              <p className="text-xs">Make sure your microphone is working and try again.</p>
            </>
          ) : (
            <>
              <p className="text-sm">Please allow microphone access when prompted.</p>
              <p className="text-sm">The interview will begin automatically.</p>
            </>
          )}
          <button
            onClick={startInterview}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            {connectionError ? 'Retry Interview' : 'Start Interview'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInterviewer;
