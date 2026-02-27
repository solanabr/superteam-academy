"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div
      className={cn(
        "relative rounded border border-[var(--c-border-subtle)] bg-[var(--c-bg)] my-4 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--c-bg-card)] border-b border-[var(--c-border-subtle)]">
        <span className="text-xs font-mono text-[var(--c-text-2)]">
          {language ?? "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--c-text-2)] hover:text-[#55E9AB] transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#55E9AB]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-[var(--c-text-em)] block">
        <code>
          {showLineNumbers
            ? lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 inline-block w-8 text-right text-[var(--c-text-2)]/50 select-none">
                    {i + 1}
                  </span>
                  {line}
                </div>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
