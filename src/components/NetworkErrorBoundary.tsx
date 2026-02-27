import { useState, useEffect, ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

export const NetworkErrorBoundary = ({ children }: Props) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Intercept global fetch errors for "Failed to fetch" pattern
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error: any) {
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("Network request failed") ||
          error.name === "TypeError"
        ) {
          console.warn("Network fetch failed:", args[0]);
          // Don't set offline for individual failures, only if truly offline
          if (!navigator.onLine) {
            setIsOffline(true);
          }
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.fetch = originalFetch;
    };
  }, []);

  if (isOffline) {
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
            It looks like you're offline or your network is blocking the connection. 
            Please check your internet connection, disable any VPN/proxy, or try switching to a different network (e.g. mobile hotspot).
          </p>
          <Button
            size="lg"
            onClick={() => {
              if (navigator.onLine) {
                setIsOffline(false);
              } else {
                window.location.reload();
              }
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <p className="text-xs text-muted-foreground mt-6">
            If the problem persists, your network may be blocking our services. 
            Try using a mobile hotspot or a different Wi-Fi network.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
