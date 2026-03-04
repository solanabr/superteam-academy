"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface LessonMarkdownProps {
  content: string;
  className?: string;
}

export function LessonMarkdown({ content, className }: LessonMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p
              className="text-base leading-relaxed mb-3 last:mb-0"
              style={{ color: "var(--text-secondary)" }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1.5 mb-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1.5 mb-3">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {children}
            </li>
          ),
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName ?? "");
            const language = match?.[1] ?? "javascript";
            const code = String(children).replace(/\n$/, "");
            const isBlock = Boolean(match) || code.includes("\n");

            if (!isBlock) {
              return (
                <code
                  className="px-1 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div
                className="rounded-lg overflow-hidden border my-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: "#0b0b14",
                    fontSize: "0.85rem",
                    lineHeight: "1.45",
                    padding: "12px 14px",
                  }}
                  showLineNumbers
                  wrapLines
                  wrapLongLines
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
