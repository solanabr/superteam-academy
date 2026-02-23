import ReactMarkdown from 'react-markdown';

interface LessonViewerProps {
  content: string;
}

export function LessonViewer({ content }: LessonViewerProps) {
  return (
    <div className="lesson-content prose-solana max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mb-4 pb-3 border-b border-card-border">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-foreground mt-8 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
          ),
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="font-mono text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                {children}
              </code>
            ) : (
              <code className="block font-mono text-sm text-foreground/90 leading-relaxed">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="bg-background-secondary border border-card-border rounded-xl p-5 overflow-x-auto my-5 text-sm font-mono">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 bg-primary/5 pl-4 py-2 my-4 rounded-r-lg text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground mb-4 ml-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground mb-4 ml-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-muted-foreground leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-card-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/30">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-card-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-muted-foreground border-b border-card-border last:border-0">{children}</td>
          ),
          hr: () => <hr className="border-card-border my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
