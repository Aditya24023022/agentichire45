import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResumeUploadProps {
  onResumeExtracted: (text: string) => void;
  onFileUploaded?: (filePath: string, fileName: string) => void;
}

export const ResumeUpload = ({ onResumeExtracted, onFileUploaded }: ResumeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfjs, setPdfjs] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Dynamically import pdfjs
    import("pdfjs-dist").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      setPdfjs(pdfjsLib);
    });
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    if (!pdfjs) {
      throw new Error("PDF.js not loaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or TXT file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText.trim()) {
        throw new Error("Could not extract text from file");
      }

      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file);

        if (!uploadError) {
          // Save to database
          await supabase.from("resumes").insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            parsed_content: extractedText,
          });
          onFileUploaded?.(filePath, file.name);
        }
      }

      onResumeExtracted(extractedText);
      toast.success("Resume uploaded and parsed successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to process resume");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground text-base flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Resume (PDF or TXT)
      </Label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        onChange={handleFileUpload}
        className="hidden"
        id="resume-upload"
      />
      
      {fileName ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <CheckCircle className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">Resume parsed successfully</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="resume-upload"
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Processing resume...</p>
            </>
          ) : (
            <>
              <FileText className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-medium">Click to upload resume</p>
              <p className="text-xs text-muted-foreground">PDF or TXT, max 10MB</p>
            </>
          )}
        </label>
      )}
    </div>
  );
};
