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
}

export function MarkdownEditor({
  value,
  onChange,
  maxLength = 10000,
  placeholder = "Write your content using Markdown...",
  minHeight = "200px",
}: MarkdownEditorProps) {
  const t = useTranslations("community");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const charPercent = value.length / maxLength;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-default)] bg-[var(--surface)]">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
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
            "px-4 py-2 text-sm font-medium transition-colors",
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
            "w-full resize-y bg-[var(--input)] p-4 font-mono text-sm text-[var(--text)]",
            "placeholder:text-[var(--text-2)] focus:outline-none"
          )}
          style={{ minHeight }}
        />
      ) : (
        <div
          className="prose prose-sm max-w-none bg-[var(--surface)] p-4 text-[var(--text)] dark:prose-invert"
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
      <div className="flex justify-end border-t border-[var(--border-default)] bg-[var(--surface)] px-4 py-1.5">
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
