import ReactMarkdown from 'react-markdown';
import { Loader2, CheckCircle2, Lightbulb, Target, Award, TrendingUp, Star, Zap } from 'lucide-react';

interface StreamingOutputProps {
  content: string;
  isStreaming: boolean;
  loading: boolean;
  placeholder?: React.ReactNode;
}

export const StreamingOutput = ({ content, isStreaming, loading, placeholder }: StreamingOutputProps) => {
  if (loading && !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">AI is generating...</p>
          <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!content && !loading) {
    return <>{placeholder}</>;
  }

  // Clean content - remove # headers and format properly
  const cleanContent = content
    .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '**$1**'); // Keep bold

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <div className="flex items-center gap-3 mt-6 mb-4 pb-3 border-b border-primary/30 first:mt-0">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                {children}
              </span>
            </div>
          ),
          h2: ({ children }) => (
            <div className="flex items-center gap-2.5 mt-5 mb-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                {children}
              </span>
            </div>
          ),
          h3: ({ children }) => (
            <div className="flex items-center gap-2 mt-4 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-base font-medium text-foreground">
                {children}
              </span>
            </div>
          ),
          p: ({ children }) => (
            <p className="text-foreground/90 leading-relaxed mb-3 text-sm">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 mb-4 ml-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 mb-4 ml-0 counter-reset-item">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-3 text-foreground/90 bg-gradient-to-r from-muted/50 to-transparent p-2.5 rounded-lg border-l-2 border-primary/40 hover:border-primary/70 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm leading-relaxed">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-primary">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-cyan-400 not-italic font-medium">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400/50 pl-4 py-3 my-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-r-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-foreground/90 text-sm">{children}</div>
              </div>
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/20">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-muted/80 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 border border-border">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted/80 p-4 rounded-lg overflow-x-auto my-4 border border-border">
              {children}
            </pre>
          ),
          hr: () => (
            <div className="my-6 flex items-center gap-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <Star className="w-3 h-3 text-primary/50" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-border shadow-lg">
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border-b border-border">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-t border-border/50 text-foreground/90">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-flex items-center gap-1 ml-1">
          <span className="w-2 h-4 bg-primary animate-pulse rounded-sm" />
        </span>
      )}
    </div>
  );
};
