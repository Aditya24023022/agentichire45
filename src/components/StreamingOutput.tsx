import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mt-5 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-foreground/90 leading-relaxed mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-4 ml-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 mb-4 ml-1 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90 flex items-start gap-2">
              <span className="text-primary mt-1.5 flex-shrink-0">•</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-primary">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-foreground/80">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-border my-6" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-t border-border/50 text-foreground/90">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-flex items-center gap-1 ml-1">
          <span className="w-2 h-4 bg-primary animate-pulse" />
        </span>
      )}
    </div>
  );
};
