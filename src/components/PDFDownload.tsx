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

// ATS-friendly keywords to enhance resume visibility
const ATS_KEYWORDS = [
  'leadership', 'managed', 'developed', 'implemented', 'achieved', 'improved',
  'increased', 'reduced', 'created', 'designed', 'analyzed', 'collaborated',
  'executed', 'delivered', 'optimized', 'streamlined', 'coordinated', 'led',
  'spearheaded', 'initiated', 'established', 'launched', 'transformed'
];

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
    // Clean markdown and special characters
    const cleanLine = line
      .replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^[-•]\s*/, '')
      .trim();
    
    const upperLine = cleanLine.toUpperCase();
    
    const isHeader = sectionHeaders.some(header => 
      upperLine === header || upperLine.startsWith(header)
    );
    
    if (isHeader || (cleanLine.length < 50 && cleanLine === cleanLine.toUpperCase() && cleanLine.length > 2 && !cleanLine.includes('@'))) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: cleanLine.toUpperCase(), content: [] };
    } else if (currentSection) {
      if (cleanLine) {
        currentSection.content.push(cleanLine);
      }
    } else {
      // Content before first section (name/contact)
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

  const generateProfessionalPDF = async () => {
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
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 15;
      const marginBottom = 15;
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

      // Parse content
      const sections = parseResumeContent(content);

      // === HEADER SECTION (Name & Contact) ===
      const headerSection = sections.find(s => s.title === 'HEADER');
      if (headerSection && headerSection.content.length > 0) {
        // Name - centered, bold, larger (like template)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        const name = headerSection.content[0] || '';
        doc.text(name, pageWidth / 2, y, { align: 'center' });
        y += 7;

        // Contact info - centered on single line with separators
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        const contactParts: string[] = [];
        for (let i = 1; i < headerSection.content.length; i++) {
          const item = headerSection.content[i].trim();
          if (item && !item.includes('---')) {
            // Clean up contact items
            const cleanItem = item.replace(/^(Email:|Mobile:|Phone:|Website:|LinkedIn:)\s*/i, '');
            if (cleanItem) contactParts.push(cleanItem);
          }
        }
        
        if (contactParts.length > 0) {
          const contactLine = contactParts.join('  |  ');
          const contactLines = doc.splitTextToSize(contactLine, contentWidth);
          for (const line of contactLines) {
            doc.text(line, pageWidth / 2, y, { align: 'center' });
            y += 4;
          }
        }
        y += 2;
      }

      // === PROCESS SECTIONS ===
      for (const section of sections) {
        if (section.title === 'HEADER') continue;

        addNewPageIfNeeded(12);

        // Section header with underline (like template)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(section.title, marginLeft, y);
        y += 1;

        // Line under section header
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 5;

        // Section content
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        let i = 0;
        while (i < section.content.length) {
          const item = section.content[i];
          addNewPageIfNeeded(5);

          // Check for organization/company + location line
          const isOrgLine = (item.includes(' - ') && !item.startsWith('-')) || 
                           (section.title.includes('EDUCATION') && item.includes('University')) ||
                           (section.title.includes('EDUCATION') && item.includes('Institute')) ||
                           (section.title.includes('EXPERIENCE') && /^[A-Z]/.test(item) && !item.startsWith('•'));

          // Check for title/degree + date line
          const hasDate = /\d{4}/.test(item) || /present/i.test(item) || /–|—|-/.test(item);
          const isTitleLine = hasDate && (item.includes(';') || /^[A-Z][a-z]/.test(item));

          if (isOrgLine && !hasDate) {
            // Organization name - bold, left aligned
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            
            // Split if contains location separator
            if (item.includes(' - ')) {
              const parts = item.split(' - ');
              doc.text(parts[0].trim(), marginLeft, y);
              if (parts[1]) {
                doc.text(parts[1].trim(), pageWidth - marginRight, y, { align: 'right' });
              }
            } else {
              doc.text(item, marginLeft, y);
            }
            y += 4.5;
            doc.setFont("helvetica", "normal");
          } else if (isTitleLine || (hasDate && i > 0)) {
            // Title/Degree with date - italic title, right-aligned date
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            
            // Extract date pattern
            const dateMatch = item.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|(?:\d{4})\s*[-–—]\s*(?:\d{4}|Present|present|Current|current)|\d{4}\s*[-–—]\s*\d{4}|\w+\s*\d{4}\s*[-–—]\s*\w+\s*\d{4})/i);
            
            if (dateMatch) {
              const dateText = dateMatch[1];
              const titleText = item.replace(dateText, '').replace(/[;|]/g, '').trim();
              doc.text(titleText, marginLeft, y);
              doc.setFont("helvetica", "normal");
              doc.text(dateText, pageWidth - marginRight, y, { align: 'right' });
            } else {
              doc.text(item, marginLeft, y);
            }
            y += 4.5;
            doc.setFont("helvetica", "normal");
          } else if (item.startsWith('•') || item.startsWith('-') || item.startsWith('*')) {
            // Bullet point
            const text = item.replace(/^[•\-*]\s*/, '').trim();
            doc.setFontSize(9.5);
            
            const bulletX = marginLeft + 2;
            const textX = marginLeft + 6;
            const bulletWidth = contentWidth - 6;
            
            doc.text('•', bulletX, y);
            const bulletLines = doc.splitTextToSize(text, bulletWidth);
            for (let j = 0; j < bulletLines.length; j++) {
              if (j > 0) {
                addNewPageIfNeeded(4);
              }
              doc.text(bulletLines[j], textX, y);
              y += 3.8;
            }
            doc.setFontSize(10);
          } else if (section.title.includes('SKILLS') || section.title.includes('COMPETENCIES')) {
            // Skills - format as inline list
            doc.setFontSize(9.5);
            const skillLines = doc.splitTextToSize(item, contentWidth);
            for (const line of skillLines) {
              addNewPageIfNeeded(4);
              doc.text(line, marginLeft, y);
              y += 3.8;
            }
            doc.setFontSize(10);
          } else if (section.title.includes('PROJECT')) {
            // Project title - bold
            if (/^[A-Z]/.test(item) && item.length < 60 && !item.includes(':')) {
              doc.setFont("helvetica", "bold");
              doc.text(item, marginLeft, y);
              doc.setFont("helvetica", "normal");
              y += 4.5;
            } else {
              // Project description
              doc.setFontSize(9.5);
              const descLines = doc.splitTextToSize(item, contentWidth);
              for (const line of descLines) {
                addNewPageIfNeeded(4);
                doc.text(line, marginLeft, y);
                y += 3.8;
              }
              doc.setFontSize(10);
            }
          } else {
            // Regular text
            doc.setFontSize(9.5);
            const textLines = doc.splitTextToSize(item, contentWidth);
            for (const line of textLines) {
              addNewPageIfNeeded(4);
              doc.text(line, marginLeft, y);
              y += 3.8;
            }
            doc.setFontSize(10);
          }
          
          i++;
        }
        
        y += 3; // Space between sections
      }

      // Download
      doc.save(`${fileName}.pdf`);
      toast.success("ATS-optimized PDF downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateProfessionalPDF}
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
