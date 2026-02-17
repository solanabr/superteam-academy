"use client";

import { useMemo } from "react";
import { highlight } from "@/lib/syntax-highlight";

interface ThreadBodyProps {
  body: string;
  className?: string;
}

type Segment =
  | { type: "text"; content: string }
  | { type: "code"; lang: string; content: string };

const LANG_LABELS: Record<string, string> = {
  rust: "Rust",
  rs: "Rust",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  bash: "Bash",
  sh: "Bash",
  shell: "Shell",
  toml: "TOML",
};

function parse(body: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: body.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", lang: match[1] || "text", content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", content: body.slice(lastIndex) });
  }

  return segments;
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono text-foreground">
      {children}
    </code>
  );
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <InlineCode key={i}>{part.slice(1, -1)}</InlineCode>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ThreadBody({ body, className }: ThreadBodyProps) {
  const segments = useMemo(() => parse(body), [body]);

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return (
            <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
              {renderInlineCode(seg.content)}
            </div>
          );
        }

        const lang = seg.lang.toLowerCase();
        const label = LANG_LABELS[lang] || seg.lang || "Code";
        const html = highlight(seg.content.replace(/\n$/, ""), lang);

        return (
          <div key={i} className="my-3 overflow-hidden rounded-lg border border-white/[0.06] bg-[#1e1e2e]">
            <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#16161e] px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7f849c]">{label}</span>
              <button
                type="button"
                className="text-[10px] text-[#7f849c] hover:text-[#cdd6f4] transition-colors"
                onClick={() => navigator.clipboard.writeText(seg.content)}
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
              <code
                className="font-mono text-[#cdd6f4]"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </pre>
          </div>
        );
      })}
    </div>
  );
}
