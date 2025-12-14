import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface PDFDownloadProps {
  content: string;
  fileName?: string;
  variant?: "default" | "outline" | "ghost";
}

export const PDFDownload = ({ content, fileName = "resume", variant = "default" }: PDFDownloadProps) => {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    if (!content.trim()) {
      toast.error("No content to download");
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set font
      doc.setFont("helvetica");
      
      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      
      // Process content - clean up markdown
      const cleanContent = content
        .replace(/#{1,6}\s/g, "") // Remove markdown headers
        .replace(/\*\*/g, "") // Remove bold markers
        .replace(/\*/g, "") // Remove italic markers
        .replace(/`/g, "") // Remove code markers
        .replace(/---/g, "") // Remove horizontal rules
        .trim();

      // Split into lines
      const lines = doc.splitTextToSize(cleanContent, maxWidth);
      
      let y = margin;
      const lineHeight = 6;

      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        doc.setFontSize(11);
        doc.text(line, margin, y);
        y += lineHeight;
      }

      // Download
      doc.save(`${fileName}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={generating || !content.trim()}
      variant={variant}
      size="sm"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download PDF
        </>
      )}
    </Button>
  );
};
