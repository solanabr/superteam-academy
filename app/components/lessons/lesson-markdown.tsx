"use client";

import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

type CodeBlockProps = {
  children: React.ReactNode;
  filename?: string;
};

function CodeBlock({ children, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const handleCopy = useCallback(async () => {
    const code = preRef.current?.querySelector("code");
    const text = code?.textContent ?? "";
    await navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {filename ?? "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3" weight="bold" />
              Copied
            </>
          ) : (
            "Copy"
          )}
        </button>
      </div>
      <pre
        ref={preRef}
        className="overflow-x-auto p-4 font-mono text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
      >
        {children}
      </pre>
    </div>
  );
}

function getFilenameFromClass(className?: string): string | undefined {
  const match = String(className ?? "").match(/language-(\w+)(?::([^\s]+))?/);
  const lang = match?.[1] ?? "";
  if (!lang) return undefined;
  return (
    match?.[2] ??
    (lang === "ts" || lang === "typescript"
      ? "example.ts"
      : lang === "rust"
        ? "example.rs"
        : `example.${lang}`)
  );
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-foreground first:mt-0 md:text-3xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mt-6 border-b border-border pb-2 text-xl font-semibold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-4 text-lg font-semibold text-foreground">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mt-3 text-base font-semibold text-foreground">{children}</h4>
  ),
  hr: () => <hr className="my-6 border-border" />,
  pre: ({ children }: { children?: React.ReactNode }) => {
    const code = Array.isArray(children) ? children[0] : children;
    const codeEl = code as React.ReactElement<{ className?: string }>;
    const filename = getFilenameFromClass(codeEl?.props?.className);
    return <CodeBlock filename={filename}>{children}</CodeBlock>;
  },
  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.includes("language-");
    if (isBlock) return <>{children}</>;
    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground border border-border/60",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="my-4 text-base leading-7 text-foreground/90">{children}</p>
  ),
};

type Props = {
  content: string;
  className?: string;
};

export function LessonMarkdown({ content, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
