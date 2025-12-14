import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseAIAgentOptions {
  type: string;
  successMessage?: string;
}

export const useAIAgent = ({ type, successMessage = "Generated successfully!" }: UseAIAgentOptions) => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (data: Record<string, any>) => {
    setLoading(true);
    setResult("");

    try {
      const response = await supabase.functions.invoke("ai-career-agent", {
        body: { type, ...data },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setResult(response.data.result);
      toast.success(successMessage);
      return response.data.result;
    } catch (error: any) {
      console.error(`Error in ${type}:`, error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message?.includes("402")) {
        toast.error("Please add credits to continue using AI features.");
      } else {
        toast.error(error.message || "Something went wrong. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult("");
  };

  return { result, loading, generate, reset };
};
