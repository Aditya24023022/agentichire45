import { useState, useEffect, ReactNode, useCallback } from "react";
import { WifiOff, RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
}

export const NetworkErrorBoundary = ({ children }: Props) => {
  const [isFullyOffline, setIsFullyOffline] = useState(!navigator.onLine);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [failedRequests, setFailedRequests] = useState(0);
  const [hasShownSlowToast, setHasShownSlowToast] = useState(false);

  const resetSlowNetwork = useCallback(() => {
    setIsSlowNetwork(false);
    setFailedRequests(0);
    setHasShownSlowToast(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsFullyOffline(false);
      resetSlowNetwork();
      toast.success("You're back online!");
    };
    const handleOffline = () => setIsFullyOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Detect slow network via Network Information API
    const connection = (navigator as any).connection;
    if (connection) {
      const checkSlow = () => {
        const slow = connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
        if (slow && !hasShownSlowToast) {
          setIsSlowNetwork(true);
          setHasShownSlowToast(true);
          toast.warning("Slow network detected. The app may take longer to load.", {
            duration: 5000,
          });
        }
      };
      checkSlow();
      connection.addEventListener("change", checkSlow);
    }

    // Intercept fetch with timeout for slow networks
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const request = args[0];
        const init = args[1] || {};
        
        // Don't override if already has signal
        if (!init.signal) {
          init.signal = controller.signal;
        }

        const response = await originalFetch(request, init);
        clearTimeout(timeoutId);
        
        // Reset failure count on success
        if (failedRequests > 0) {
          setFailedRequests(0);
        }
        
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === "AbortError") {
          console.warn("Request timed out (slow network):", args[0]);
          toast.error("Request timed out. Retrying automatically...", { duration: 3000 });
          // Retry once without timeout override
          try {
            return await originalFetch(...args);
          } catch {
            // fall through to network error handling
          }
        }

        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("Network request failed") ||
          error.name === "TypeError"
        ) {
          setFailedRequests(prev => prev + 1);
          console.warn("Network fetch failed:", args[0]);
          
          if (!navigator.onLine) {
            setIsFullyOffline(true);
          }
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.fetch = originalFetch;
      if (connection) {
        connection.removeEventListener("change", () => {});
      }
    };
  }, [failedRequests, hasShownSlowToast, resetSlowNetwork]);

  // Only block UI when completely offline
  if (isFullyOffline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            No Internet Connection
          </h1>
          <p className="text-muted-foreground mb-6">
            Please check your internet connection and try again.
          </p>
          <Button
            size="lg"
            onClick={() => {
              if (navigator.onLine) {
                setIsFullyOffline(false);
              } else {
                window.location.reload();
              }
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // For slow networks: show children (app works) + a subtle banner
  return (
    <>
      {isSlowNetwork && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-yellow-950 text-center text-xs py-1 px-4 flex items-center justify-center gap-2">
          <Wifi className="w-3 h-3" />
          Slow connection detected — some features may take longer to load
          <button
            onClick={resetSlowNetwork}
            className="ml-2 underline text-xs hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </>
  );
};
