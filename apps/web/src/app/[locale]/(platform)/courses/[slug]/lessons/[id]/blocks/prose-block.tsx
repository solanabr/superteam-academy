"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import type { ProseBlockData } from "@superteam-lms/types";
import type { BlockRenderProps } from "./types";

function CodeBlockWithCopy({
  children,
  ...props
}: { children?: ReactNode } & React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-lg border-[2.5px] border-border bg-card px-2.5 py-1 font-display text-xs font-bold text-text shadow-push-sm transition-colors hover:bg-subtle"
        aria-label="Copy code"
      >
        {copied ? (
          <span className="text-success">Copied</span>
        ) : (
          <span>Copy</span>
        )}
      </button>
    </div>
  );
}

const markdownComponents = { pre: CodeBlockWithCopy };

export function ProseBlock({ block }: BlockRenderProps) {
  const b = block as ProseBlockData;
  return (
    <div className="prose max-w-3xl dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={markdownComponents}
      >
        {b.src}
      </ReactMarkdown>
    </div>
  );
}
