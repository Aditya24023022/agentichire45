import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Video, Loader2, Mic, MicOff, Play, CheckCircle2, XCircle, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import interviewerAvatar from "@/assets/interviewer-avatar.png";

interface Question {
  question: string;
  category: string;
}

interface Response {
  question: string;
  answer: string;
  feedback?: string;
  score?: number;
}

const MockInterview = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [phase, setPhase] = useState<"setup" | "interview" | "results">("setup");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });

    // Load voices when available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [navigate, cameraStream]);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false 
      });
      setCameraStream(stream);
      setCameraEnabled(true);
      // Set video source after a small delay to ensure ref is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
      toast.success("Camera enabled - you look great!");
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Failed to access camera. Please allow camera permissions.");
    }
  };

  const disableCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  const speakText = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true);
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1.2; // Higher pitch for female voice
        
        // Get all available voices
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Priority 1: Indian English female voices
        let selectedVoice = voices.find(v => 
          v.lang === 'en-IN' && (
            v.name.toLowerCase().includes('female') ||
            v.name.includes('Aditi') ||
            v.name.includes('Raveena') ||
            v.name.includes('Priya')
          )
        );
        
        // Priority 2: Any Indian English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === 'en-IN');
        }
        
        // Priority 3: Female English voices
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && (
              v.name.toLowerCase().includes('female') ||
              v.name.includes('Samantha') ||
              v.name.includes('Karen') ||
              v.name.includes('Moira') ||
              v.name.includes('Tessa') ||
              v.name.includes('Fiona') ||
              v.name.includes('Victoria') ||
              v.name.includes('Zira')
            )
          );
        }
        
        // Priority 4: Any English voice with higher pitch to sound more feminine
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en'));
          utterance.pitch = 1.4; // Even higher pitch as fallback
        }
        
        utterance.voice = selectedVoice || null;
        console.log('Selected voice:', selectedVoice?.name || 'default');
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        resolve();
      }
    });
  }, []);

  const startInterview = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
    }

    // Request camera access
    if (!cameraEnabled) {
      await enableCamera();
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-interview", {
        body: { action: "generate-questions", jobDescription, resume },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      setQuestions(response.data.questions);
      setPhase("interview");
      toast.success("Interview started!");

      // Speak introduction with Indian-style greeting
      await speakText("Namaste! Welcome to your interview. I'm Priya, and I'll be conducting your interview today. I'll be asking you 7 questions based on the job description. Please take your time to answer each question thoroughly. Let's begin with the first question.");
      
      setTimeout(() => {
        speakText(response.data.questions[0].question);
      }, 1500);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  // Speech Recognition for real-time voice input
  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please type your answer.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success("Listening... Speak your answer");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setUserAnswer(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          toast.error("Failed to recognize speech. Please try again or type.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      mediaRecorderRef.current = recognition as any;
      recognition.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      toast.error("Failed to start listening. Please type your answer.");
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      (mediaRecorderRef.current as any).stop?.();
      setIsRecording(false);
      toast.success("Stopped listening");
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    setLoading(true);
    const currentQuestion = questions[currentQuestionIndex];

    try {
      const evalResponse = await supabase.functions.invoke("generate-interview", {
        body: {
          action: "evaluate-response",
          question: currentQuestion.question,
          userResponse: userAnswer,
        },
      });

      if (evalResponse.error) throw evalResponse.error;

      const evaluation = evalResponse.data;
      const newResponse: Response = {
        question: currentQuestion.question,
        answer: userAnswer,
        feedback: evaluation.feedback,
        score: evaluation.score,
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);
      setUserAnswer("");

      await speakText(evaluation.feedback);

      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        
        setTimeout(() => {
          speakText(`Very good. Let's move on. ${questions[nextIndex].question}`);
        }, 1500);
      } else {
        await speakText("Thank you for completing the interview. Let me analyze your overall performance.");
        
        const finalResponse = await supabase.functions.invoke("generate-interview", {
          body: {
            action: "final-evaluation",
            jobDescription,
            allResponses: updatedResponses,
          },
        });

        if (finalResponse.error) throw finalResponse.error;

        setFinalScore(finalResponse.data);
        setPhase("results");

        if (userId) {
          const insertData = {
            user_id: userId,
            job_description: jobDescription,
            resume_content: resume,
            questions: questions as any,
            responses: updatedResponses as any,
            score: finalResponse.data.overallScore,
            feedback: finalResponse.data.summary,
          };
          await supabase.from("interview_sessions").insert(insertData);
        }

        await speakText(finalResponse.data.summary);
        disableCamera();
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to evaluate response");
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setUserAnswer("");
    setFinalScore(null);
    disableCamera();
  };

  return (
    <FeaturePageLayout
      icon={Video}
      title="Mock Interview"
      description="Practice with Priya, your AI interviewer - get real-time feedback and scoring"
    >
      {phase === "setup" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Interviewer Introduction */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30">
            <div className="flex items-center gap-4">
              <img 
                src={interviewerAvatar} 
                alt="Priya - AI Interviewer" 
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Meet Priya</h3>
                <p className="text-sm text-muted-foreground">
                  Your AI interviewer with 10+ years of HR experience. She'll ask you 7 medium-level questions and provide detailed feedback.
                </p>
              </div>
            </div>
          </div>

          <JobUrlInput onJobScraped={(content) => setJobDescription(content)} />
          <ResumeUpload onResumeExtracted={(text) => setResume(text)} />

          <div className="space-y-3">
            <Label className="text-foreground text-base">Your Resume</Label>
            <Textarea
              placeholder="Paste your resume or upload above..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground text-base">Job Description</Label>
            <Textarea
              placeholder="Paste the job description or use URL above..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Camera will be enabled</p>
                <p className="text-xs text-muted-foreground">Your camera will turn on when the interview starts for a realistic experience</p>
              </div>
            </div>
          </div>

          <Button onClick={startInterview} variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Interview...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Mock Interview
              </>
            )}
          </Button>
        </div>
      )}

      {phase === "interview" && questions.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">{questions[currentQuestionIndex].category}</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
          </div>

          {/* Video Call Layout */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Interviewer */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border aspect-video">
              <img 
                src={interviewerAvatar} 
                alt="Priya - Interviewer" 
                className={`w-full h-full object-cover ${isSpeaking ? 'animate-pulse' : ''}`}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                  <span className="text-white text-sm font-medium">Priya (Interviewer)</span>
                </div>
              </div>
              {isSpeaking && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 h-5 bg-primary rounded animate-pulse" style={{ animationDelay: '450ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* User Camera */}
            <div className="relative rounded-2xl overflow-hidden bg-muted border border-border aspect-video">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <CameraOff className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Camera off</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-white text-sm font-medium">You</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={cameraEnabled ? disableCamera : enableCamera}
                  >
                    {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-lg text-foreground">{questions[currentQuestionIndex].question}</p>
          </div>

          {/* Answer Input - Real-time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Your Answer (speak or type)</Label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopListening : startListening}
                disabled={isSpeaking}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Speaking
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Speak Answer
                  </>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Speak your answer directly or type here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="min-h-[120px] bg-card border-border resize-none"
            />
            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Listening to your answer...
              </div>
            )}
          </div>

          <Button onClick={submitAnswer} variant="hero" size="lg" className="w-full" disabled={loading || !userAnswer.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluating...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>

          {/* Previous Responses */}
          {responses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Previous Answers</h3>
              {responses.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                  <p className="text-sm font-medium text-foreground">Q{i + 1}: {r.question}</p>
                  <p className="text-sm text-muted-foreground">{r.answer}</p>
                  {r.feedback && (
                    <div className="flex items-start gap-2 pt-2 border-t border-border">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Score: {r.score}/10</span>
                      <p className="text-xs text-muted-foreground">{r.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === "results" && finalScore && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border">
            <img 
              src={interviewerAvatar} 
              alt="Priya" 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/50 mb-4"
            />
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${finalScore.overallScore * 2.83} 283`}
                  className="text-primary"
                />
              </svg>
              <span className="text-4xl font-bold text-foreground">{finalScore.overallScore}</span>
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Overall Score</p>
          </div>

          {/* Strengths */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {finalScore.strengths?.map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-500" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {finalScore.improvements?.map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">Summary from Priya</h3>
            <p className="text-sm text-muted-foreground">{finalScore.summary}</p>
          </div>

          <Button onClick={resetInterview} variant="outline" size="lg" className="w-full">
            Start New Interview
          </Button>
        </div>
      )}
    </FeaturePageLayout>
  );
};

export default MockInterview;
