"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  minHeight?: string;
  /** Render without the outer border/radius so the caller can frame it. */
  flush?: boolean;
  /** Dense rendering for narrow embeds — 13px type, tighter tabs. */
  compact?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  maxLength = 10000,
  placeholder = "Write your content using Markdown...",
  minHeight = "200px",
  flush = false,
  compact = false,
}: MarkdownEditorProps) {
  const t = useTranslations("community");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const charPercent = value.length / maxLength;

  return (
    <div
      className={cn(
        "overflow-hidden",
        // `flush` drops the frame so a caller can own it — the answer composer
        // wraps the editor AND its submit button in one block, and two nested
        // frames read as two controls.
        !flush && "rounded-lg border border-[var(--border-default)]"
      )}
    >
      {/* Tabs */}
      <div className="flex bg-[var(--input)]">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "font-medium transition-colors",
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            tab === "write"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          {t("write")}
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "font-medium transition-colors",
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            tab === "preview"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          {t("preview")}
        </button>
      </div>

      {/* Content */}
      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          className={cn(
            // Sans, not mono: the guide reserves mono for data — prose the
            // learner is writing is body copy (code renders mono in Preview).
            "w-full resize-y bg-[var(--input)] p-4 text-[var(--text)]",
            compact ? "text-[13px]" : "text-sm",
            "placeholder:text-[var(--text-2)] focus:outline-none"
          )}
          style={{ minHeight }}
        />
      ) : (
        <div
          className="prose prose-sm max-w-none bg-[var(--input)] p-4 text-[var(--text)] dark:prose-invert"
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="italic text-[var(--text-2)]">
              {t("nothingToPreview")}
            </p>
          )}
        </div>
      )}

      {/* Character counter */}
      <div className="flex justify-end bg-[var(--input)] px-4 py-1.5">
        <span
          className={cn(
            "text-xs",
            charPercent > 0.9 ? "text-[var(--danger)]" : "text-[var(--text-2)]"
          )}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
