import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobUrlInputProps {
  onJobScraped: (jobDescription: string, metadata?: { title?: string; company?: string }) => void;
}

export const JobUrlInput = ({ onJobScraped }: JobUrlInputProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraped, setScraped] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Please enter a job URL");
      return;
    }

    setLoading(true);
    setScraped(false);

    try {
      const response = await supabase.functions.invoke("scrape-job", {
        body: { url: url.trim() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to scrape job");
      }

      const { content, title } = response.data.data;
      onJobScraped(content, { title });
      setScraped(true);
      toast.success("Job description extracted successfully!");
    } catch (error: any) {
      console.error("Scrape error:", error);
      toast.error(error.message || "Failed to scrape job URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground text-base flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Paste Job URL
      </Label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://linkedin.com/jobs/... or any job posting URL"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setScraped(false);
          }}
          className="flex-1 bg-card border-border"
        />
        <Button
          onClick={handleScrape}
          disabled={loading || !url.trim()}
          variant={scraped ? "secondary" : "default"}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scraping...
            </>
          ) : scraped ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Scraped
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Scrape Job
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a job URL from LinkedIn, Indeed, or any job board to auto-extract the description
      </p>
    </div>
  );
};
