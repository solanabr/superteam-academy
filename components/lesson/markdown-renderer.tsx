'use client';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ markdown }: { markdown: string }): JSX.Element {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1(props) {
            return <h1 className="text-2xl font-bold" {...props} />;
          },
          h2(props) {
            return <h2 className="text-xl font-semibold" {...props} />;
          },
          h3(props) {
            return <h3 className="text-lg font-semibold" {...props} />;
          },
          p(props) {
            return <p className="text-sm leading-relaxed text-foreground/85" {...props} />;
          },
          ul(props) {
            return <ul className="list-disc space-y-1 pl-5" {...props} />;
          },
          ol(props) {
            return <ol className="list-decimal space-y-1 pl-5" {...props} />;
          },
          li(props) {
            return <li className="text-sm" {...props} />;
          },
          code(props) {
            const { className, children } = props;
            return (
              <code className={`${className ?? ''} rounded bg-muted px-1.5 py-0.5 text-[0.85em]`}>{children}</code>
            );
          },
          pre(props) {
            return <pre className="overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-4" {...props} />;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
