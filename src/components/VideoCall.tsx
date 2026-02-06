import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  User, Loader2, Wifi, WifiOff, ScreenShare, ScreenShareOff
} from "lucide-react";
import { toast } from "sonner";

interface VideoCallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callSessionId: string;
  isInitiator: boolean;
  partnerName: string;
  callType: "video" | "audio";
  currentUserId: string;
}

export const VideoCall = ({
  open,
  onOpenChange,
  callSessionId,
  isInitiator,
  partnerName,
  callType,
  currentUserId,
}: VideoCallProps) => {
  const [callState, setCallState] = useState<"permission" | "connecting" | "connected" | "ended">("permission");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    setCallState("ended");
    setCallDuration(0);
  }, []);

  const handleEndCall = useCallback(async () => {
    // Send end signal
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: {
        type: "end",
        data: null,
        from: currentUserId,
      },
    });

    // Update call session status
    await supabase
      .from("call_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: callDuration,
      })
      .eq("id", callSessionId);

    cleanup();
    onOpenChange(false);
  }, [currentUserId, callDuration, callSessionId, cleanup, onOpenChange]);

  // CRITICAL: This is called directly from a button click, not from useEffect
  const startCallWithPermission = async () => {
    setPermissionError(null);
    
    try {
      // Request media permissions directly in click handler
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: callType === "video" ? { facingMode: "user" } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Now set up WebRTC connection
      setCallState("connecting");
      await setupPeerConnection(stream);
      
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      if (error.name === "NotAllowedError") {
        setPermissionError("Camera/microphone access denied. Please allow access in your browser settings.");
      } else if (error.name === "NotFoundError") {
        setPermissionError("No camera or microphone found. Please connect a device.");
      } else {
        setPermissionError("Could not access camera/microphone. Please try again.");
      }
    }
  };

  const setupPeerConnection = async (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "candidate",
            data: event.candidate,
            from: currentUserId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        startTimer();
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        toast.error("Connection lost");
        handleEndCall();
      }
    };

    // Set up signaling channel
    const channel = supabase.channel(`call:${callSessionId}`);
    channelRef.current = channel;

    channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
      if (payload.from !== currentUserId) {
        await handleSignal(payload, pc);
      }
    });

    await channel.subscribe();

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channel.send({
        type: "broadcast",
        event: "signal",
        payload: {
          type: "offer",
          data: offer,
          from: currentUserId,
        },
      });
    }
  };

  const handleSignal = async (signal: any, pc: RTCPeerConnection) => {
    try {
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channelRef.current?.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "answer",
            data: answer,
            from: currentUserId,
          },
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      } else if (signal.type === "candidate") {
        await pc.addIceCandidate(new RTCIceCandidate(signal.data));
      } else if (signal.type === "end") {
        cleanup();
        onOpenChange(false);
        toast.info("Call ended");
      }
    } catch (error) {
      console.error("Error handling signal:", error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }
        setIsScreenSharing(false);
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  // Cleanup on dialog close
  useEffect(() => {
    if (!open) {
      cleanup();
      setCallState("permission");
      setPermissionError(null);
    }
  }, [open, cleanup]);

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value && callState === "connected") {
        handleEndCall();
      } else {
        cleanup();
        onOpenChange(value);
      }
    }}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {callType === "video" ? (
                  <Video className="w-5 h-5 text-primary" />
                ) : (
                  <Phone className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold">{partnerName}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {callType === "video" ? "Video Call" : "Audio Call"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={callState === "connected" ? "default" : "secondary"}>
                {callState === "permission" ? (
                  "Waiting..."
                ) : callState === "connecting" ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting...</>
                ) : callState === "connected" ? (
                  <><Wifi className="w-3 h-3 mr-1" /> {formatDuration(callDuration)}</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> Ended</>
                )}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black overflow-hidden">
          {/* Permission Request Screen */}
          {callState === "permission" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center max-w-md p-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  {callType === "video" ? (
                    <Video className="w-10 h-10 text-primary" />
                  ) : (
                    <Mic className="w-10 h-10 text-primary" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Start {callType === "video" ? "Video" : "Audio"} Call
                </h3>
                <p className="text-muted-foreground mb-6">
                  Click the button below to allow access to your {callType === "video" ? "camera and microphone" : "microphone"}
                </p>
                
                {permissionError && (
                  <div className="p-4 rounded-lg bg-destructive/10 text-destructive mb-4 text-sm">
                    {permissionError}
                  </div>
                )}
                
                <Button
                  size="lg"
                  onClick={startCallWithPermission}
                  className="w-full"
                >
                  {callType === "video" ? (
                    <Video className="w-5 h-5 mr-2" />
                  ) : (
                    <Phone className="w-5 h-5 mr-2" />
                  )}
                  Start Call
                </Button>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Your browser will ask for permission to use your {callType === "video" ? "camera and microphone" : "microphone"}
                </p>
              </div>
            </div>
          )}

          {/* Remote Video (Full Screen) */}
          {callState !== "permission" && (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (Picture in Picture) */}
              {callType === "video" && (
                <div className="absolute bottom-4 right-4 w-40 h-32 rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

              {/* Audio-only placeholder */}
              {callType === "audio" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-white text-xl font-semibold">{partnerName}</p>
                    <p className="text-white/70">
                      {callState === "connected" ? "Connected" : "Connecting..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Connecting overlay */}
              {callState === "connecting" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                    <p className="text-white text-lg">Connecting to {partnerName}...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        {callState !== "permission" && (
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {callType === "video" && (
                <>
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleScreenShare}
                  >
                    {isScreenSharing ? (
                      <ScreenShareOff className="w-5 h-5" />
                    ) : (
                      <ScreenShare className="w-5 h-5" />
                    )}
                  </Button>
                </>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14"
                onClick={handleEndCall}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
