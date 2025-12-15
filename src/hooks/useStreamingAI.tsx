import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseStreamingAIOptions {
  type: string;
  successMessage?: string;
}

export const useStreamingAI = ({ type, successMessage = "Generated successfully!" }: UseStreamingAIOptions) => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    setResult("");
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-career-agent-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type, ...data }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("Please add credits to continue using AI features.");
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, newlineIndex).trim();
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.startsWith(":") || line === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResult += content;
              setResult(fullResult);
            }
          } catch {
            // Incomplete JSON, wait for more data
          }
        }
      }

      setIsStreaming(false);
      toast.success(successMessage);
      return fullResult;
    } catch (error: unknown) {
      console.error(`Error in streaming ${type}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [type, successMessage]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setResult("");
  }, []);

  return { result, loading, isStreaming, generate, cancel, reset };
};
