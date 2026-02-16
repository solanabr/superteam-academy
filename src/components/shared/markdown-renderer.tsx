'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      components={{
        // Custom heading styles
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-5 mb-2 text-foreground">{children}</h3>
        ),
        // Custom code blocks
        pre: ({ children }) => (
          <pre className="bg-[#0D1117] dark:bg-[#0D1117] rounded-lg p-4 overflow-x-auto my-4 border border-border/30">
            {children}
          </pre>
        ),
        code: ({ className: codeClassName, children, ...props }) => {
          const isInline = !codeClassName;
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={cn('text-sm font-mono', codeClassName)} {...props}>
              {children}
            </code>
          );
        },
        // Custom blockquote for tips
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4 my-4 not-italic">
            {children}
          </blockquote>
        ),
        // Custom links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        // Custom lists
        ul: ({ children }) => (
          <ul className="space-y-1 my-3 list-disc list-inside">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 my-3 list-decimal list-inside">{children}</ol>
        ),
        // Custom table
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-border rounded-lg">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-3 py-2 text-left text-sm font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2 text-sm">{children}</td>
        ),
        // Custom paragraph
        p: ({ children }) => (
          <p className="my-3 text-muted-foreground leading-relaxed">{children}</p>
        ),
        // Custom image
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="rounded-lg border border-border my-4 max-w-full"
            loading="lazy"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
