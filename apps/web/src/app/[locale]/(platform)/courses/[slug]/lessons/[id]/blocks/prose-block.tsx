"use client";

import {
  isValidElement,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
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

/** Flattens a rendered markdown subtree back to plain text. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

const VERSION_STAMP_RE = /^\s*version stamp\b/i;

/**
 * Version-stamp blockquotes render as a compact metadata chip row rather than
 * a pull-quote (#942 item 5). Presentational only: the authored markdown is
 * untouched, this just recognizes the leading "Version stamp" blockquote the
 * content standard puts under the h1 and demotes it to mono/muted metadata.
 */
function ProseBlockquote({
  children,
  ...props
}: {
  children?: ReactNode;
} & React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  const label = useTranslations("lesson")("versionStamp");
  if (!VERSION_STAMP_RE.test(textOf(children))) {
    return <blockquote {...props}>{children}</blockquote>;
  }
  return (
    <div
      aria-label={label}
      className="not-prose my-4 flex flex-wrap items-baseline gap-x-2 rounded-[var(--r-lg)] border border-border bg-subtle px-3 py-2 font-mono text-[11px] leading-relaxed text-text-3 [&_code]:bg-transparent [&_code]:p-0 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-text-2"
    >
      {children}
    </div>
  );
}

const markdownComponents = {
  pre: CodeBlockWithCopy,
  blockquote: ProseBlockquote,
};

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
