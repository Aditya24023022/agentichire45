import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Lightbulb, Target, Zap, Star, TrendingUp, BookOpen, Briefcase } from 'lucide-react';

interface ChatMessageStyledProps {
  content: string;
  isCompact?: boolean;
}

export const ChatMessageStyled = ({ content, isCompact = false }: ChatMessageStyledProps) => {
  // Clean content - remove # headers
  const cleanContent = content.replace(/^#{1,6}\s+/gm, '');

  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';
  const padding = isCompact ? 'p-1.5' : 'p-2';

  return (
    <div className={`prose prose-invert max-w-none ${textSize}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-primary/20">
              <Target className={`${iconSize} text-primary`} />
              <span className="font-bold text-primary">{children}</span>
            </div>
          ),
          h2: ({ children }) => (
            <div className="flex items-center gap-1.5 mt-3 mb-1.5">
              <Zap className={`${iconSize} text-amber-400`} />
              <span className="font-semibold text-foreground">{children}</span>
            </div>
          ),
          h3: ({ children }) => (
            <div className="flex items-center gap-1.5 mt-2 mb-1">
              <Star className={`${iconSize} text-cyan-400`} />
              <span className="font-medium text-foreground">{children}</span>
            </div>
          ),
          p: ({ children }) => (
            <p className="text-foreground/90 leading-relaxed mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-2 ml-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 mb-2 ml-0 list-none">{children}</ol>
          ),
          li: ({ children }) => (
            <li className={`flex items-start gap-2 text-foreground/90 bg-gradient-to-r from-primary/5 to-transparent ${padding} rounded-lg border-l-2 border-primary/30`}>
              <CheckCircle2 className={`${iconSize} text-emerald-400 mt-0.5 flex-shrink-0`} />
              <span className="leading-relaxed">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-primary">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-cyan-400 not-italic font-medium">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-2 border-amber-400/50 pl-2 py-1 my-2 bg-amber-500/5 rounded-r`}>
              <div className="flex items-start gap-1.5">
                <Lightbulb className={`${iconSize} text-amber-400 mt-0.5 flex-shrink-0`} />
                <div className="text-foreground/90">{children}</div>
              </div>
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[10px] font-mono">
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded border border-border/50">
              <table className="w-full text-[10px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-primary/10 border-b border-border/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1 text-left font-semibold text-primary">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 border-t border-border/30 text-foreground/90">{children}</td>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};
