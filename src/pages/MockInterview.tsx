import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { JobUrlInput } from "@/components/JobUrlInput";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Video, Loader2, Mic, MicOff, Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
  }, [navigate]);

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true);
      
      // Use browser's built-in Web Speech API (free, no API key needed)
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
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
  };

  const startInterview = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
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

      // Speak introduction
      await speakText("Welcome to your mock interview. I'll be asking you 7 questions based on the job description. Take your time to answer each question thoroughly. Let's begin with the first question.");
      
      setTimeout(() => {
        speakText(response.data.questions[0].question);
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started - speak your answer");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Recording stopped - please type or review your answer");
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
      // Evaluate response
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

      // Speak feedback
      await speakText(evaluation.feedback);

      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        
        setTimeout(() => {
          speakText(`Next question. ${questions[nextIndex].question}`);
        }, 2000);
      } else {
        // End interview, get final evaluation
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

        // Save to database
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
  };

  return (
    <FeaturePageLayout
      icon={Video}
      title="Mock Interview"
      description="Practice with an AI interviewer powered by voice - get scored and feedback"
    >
      {phase === "setup" && (
        <div className="max-w-2xl mx-auto space-y-6">
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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{questions[currentQuestionIndex].category}</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
          </div>

          {/* Avatar Area */}
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border p-8 flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full bg-primary/30 flex items-center justify-center mb-4 ${isSpeaking ? 'animate-pulse ring-4 ring-primary/50' : ''}`}>
              <Video className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isSpeaking ? "AI Interviewer is speaking..." : "Listening..."}
            </p>
          </div>

          {/* Question */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-lg text-foreground">{questions[currentQuestionIndex].question}</p>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Your Answer</Label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Record Answer
                  </>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Type your answer here or use the microphone..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="min-h-[150px] bg-card border-border resize-none"
            />
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
            <h3 className="text-lg font-semibold text-foreground mb-3">Summary</h3>
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
