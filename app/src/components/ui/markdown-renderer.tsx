"use client";

import { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { Check, Copy } from "lucide-react";
import "highlight.js/styles/github-dark-dimmed.css";

const displayLang: Record<string, string> = {
  rust: "Rust",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  json: "JSON",
  toml: "TOML",
  yaml: "YAML",
  sql: "SQL",
  css: "CSS",
  html: "HTML",
  tsx: "TSX",
  jsx: "JSX",
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  // Extract language from children
  let language = "";

  if (
    children &&
    typeof children === "object" &&
    "props" in (children as React.ReactElement)
  ) {
    const child = children as React.ReactElement<{
      className?: string;
    }>;
    const cls = child.props.className ?? "";
    const langMatch = cls.match(/language-(\w+)/);
    language = langMatch?.[1] ?? "";
  }

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="group relative mb-4 overflow-hidden rounded-lg border border-[#373e47] bg-[#22272e]">
      {language && (
        <div className="flex items-center justify-between border-b border-[#373e47] bg-[#2d333b] px-4 py-2">
          <span className="text-xs font-medium text-[#768390]">
            {displayLang[language] ?? language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#768390] transition-colors hover:bg-[#373e47] hover:text-[#adbac7]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
      {!language && (
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-[#768390] opacity-0 transition-all hover:bg-[#373e47] hover:text-[#adbac7] group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
      <pre
        ref={preRef}
        className="overflow-x-auto !bg-transparent !p-4 text-sm leading-relaxed !m-0"
      >
        {children}
      </pre>
    </div>
  );
}

const components: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-2xl font-semibold tracking-tight border-b border-border pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-xl font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-2 text-lg font-semibold">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-7 text-foreground/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-[#2d333b] px-1.5 py-0.5 text-[0.875em] font-mono text-[#adbac7]">
          {children}
        </code>
      );
    }
    return (
      <code className={`${className} text-sm`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border px-4 py-2">{children}</td>
  ),
  hr: () => <hr className="my-6 border-border" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="mb-4 rounded-lg border border-border max-w-full"
    />
  ),
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
