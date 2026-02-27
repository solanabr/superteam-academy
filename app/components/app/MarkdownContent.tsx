"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/** Ensure newlines are real so markdown block elements (# headings, - lists) parse correctly. */
function normalizeNewlines(s: string): string {
  return s.replace(/\\n/g, "\n").trim();
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const normalized = normalizeNewlines(content);
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  );
}
