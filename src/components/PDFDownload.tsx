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

interface ResumeSection {
  title: string;
  content: string[];
}

const parseResumeContent = (content: string): ResumeSection[] => {
  const sections: ResumeSection[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentSection: ResumeSection | null = null;
  
  const sectionHeaders = [
    'CONTACT', 'SUMMARY', 'PROFESSIONAL SUMMARY', 'OBJECTIVE',
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT',
    'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES',
    'CERTIFICATIONS', 'CERTIFICATES', 'PROJECTS', 'ACHIEVEMENTS',
    'AWARDS', 'PUBLICATIONS', 'LANGUAGES', 'REFERENCES'
  ];

  for (const line of lines) {
    const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
    const upperLine = cleanLine.toUpperCase();
    
    const isHeader = sectionHeaders.some(header => 
      upperLine === header || upperLine.includes(header)
    );
    
    if (isHeader || (cleanLine.length < 40 && cleanLine === cleanLine.toUpperCase() && cleanLine.length > 2)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: cleanLine.toUpperCase(), content: [] };
    } else if (currentSection) {
      if (cleanLine) {
        currentSection.content.push(cleanLine);
      }
    } else {
      // Content before first section (likely name/contact)
      if (!sections.find(s => s.title === 'HEADER')) {
        sections.unshift({ title: 'HEADER', content: [cleanLine] });
      } else {
        sections[0].content.push(cleanLine);
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
};

export const PDFDownload = ({ content, fileName = "resume", variant = "default" }: PDFDownloadProps) => {
  const [generating, setGenerating] = useState(false);

  const generateHarvardStylePDF = async () => {
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

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 25;
      const marginRight = 25;
      const marginTop = 20;
      const marginBottom = 20;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let y = marginTop;

      const addNewPageIfNeeded = (neededSpace: number) => {
        if (y + neededSpace > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
          return true;
        }
        return false;
      };

      // Parse content into sections
      const sections = parseResumeContent(content);

      // Header section (Name & Contact)
      const headerSection = sections.find(s => s.title === 'HEADER');
      if (headerSection && headerSection.content.length > 0) {
        // Name - centered, bold, larger
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        const name = headerSection.content[0] || '';
        doc.text(name, pageWidth / 2, y, { align: 'center' });
        y += 8;

        // Contact info - centered, smaller
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        const contactInfo = headerSection.content.slice(1).join(' | ');
        if (contactInfo) {
          const contactLines = doc.splitTextToSize(contactInfo, contentWidth);
          for (const line of contactLines) {
            doc.text(line, pageWidth / 2, y, { align: 'center' });
            y += 4;
          }
        }
        y += 3;

        // Horizontal line under header
        doc.setLineWidth(0.5);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 8;
      }

      // Process other sections
      for (const section of sections) {
        if (section.title === 'HEADER') continue;

        addNewPageIfNeeded(15);

        // Section header - bold, uppercase
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text(section.title, marginLeft, y);
        y += 1;

        // Line under section header
        doc.setLineWidth(0.3);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 5;

        // Section content
        doc.setFont("times", "normal");
        doc.setFontSize(10);

        for (const item of section.content) {
          addNewPageIfNeeded(6);

          // Check if it's a bullet point
          let text = item;
          let isBullet = false;
          
          if (item.startsWith('•') || item.startsWith('-') || item.startsWith('*')) {
            text = item.replace(/^[•\-*]\s*/, '');
            isBullet = true;
          }

          if (isBullet) {
            doc.text('•', marginLeft + 2, y);
            const bulletLines = doc.splitTextToSize(text, contentWidth - 8);
            for (let i = 0; i < bulletLines.length; i++) {
              if (i > 0) addNewPageIfNeeded(4);
              doc.text(bulletLines[i], marginLeft + 7, y);
              y += 4;
            }
          } else {
            // Check if it's a job title/company line (usually contains dates)
            const hasDate = /\d{4}/.test(text) || /present/i.test(text);
            
            if (hasDate && text.includes('|')) {
              // Split into title and date
              const parts = text.split('|').map(p => p.trim());
              doc.setFont("times", "bold");
              doc.text(parts[0], marginLeft, y);
              if (parts[1]) {
                doc.setFont("times", "normal");
                doc.text(parts[1], pageWidth - marginRight, y, { align: 'right' });
              }
              y += 5;
            } else if (hasDate) {
              doc.setFont("times", "bold");
              const textLines = doc.splitTextToSize(text, contentWidth);
              for (const line of textLines) {
                addNewPageIfNeeded(4);
                doc.text(line, marginLeft, y);
                y += 4;
              }
              doc.setFont("times", "normal");
              y += 1;
            } else {
              const textLines = doc.splitTextToSize(text, contentWidth);
              for (const line of textLines) {
                addNewPageIfNeeded(4);
                doc.text(line, marginLeft, y);
                y += 4;
              }
            }
          }
        }
        
        y += 4; // Space between sections
      }

      // Download
      doc.save(`${fileName}.pdf`);
      toast.success("ATS-friendly PDF downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateHarvardStylePDF}
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
