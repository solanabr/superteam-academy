"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface MarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Markdown authoring field with a Write / Preview toggle for the teacher course
 * builder. The preview uses the SAME plugin set as the learner lesson page
 * (`lesson-client.tsx`: remark-gfm + rehype-raw + rehype-highlight in a `prose`
 * container) so a teacher sees exactly what the learner will. Distinct from the
 * community `MarkdownEditor`, which is bound to the community i18n namespace and
 * omits rehype-raw.
 */
export function MarkdownField({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
}: MarkdownFieldProps) {
  const t = useTranslations("teacher.builder");
  const [tab, setTab] = useState<"write" | "preview">("write");

  const tabClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 text-xs font-medium transition-colors",
      active
        ? "border-b-2 border-primary text-primary"
        : "text-text-2 hover:text-text"
    );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className
      )}
    >
      <div
        className="flex border-b border-border bg-[var(--surface)]"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "write"}
          onClick={() => setTab("write")}
          className={tabClass(tab === "write")}
        >
          {t("write")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          onClick={() => setTab("preview")}
          className={tabClass(tab === "preview")}
        >
          {t("preview")}
        </button>
      </div>

      {tab === "write" ? (
        <textarea
          className="w-full resize-y bg-[var(--input)] px-2.5 py-1.5 text-sm text-text focus-visible:outline-none"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="prose prose-sm max-w-none bg-[var(--surface)] px-3 py-2 text-text dark:prose-invert">
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="italic text-text-3">{t("previewEmpty")}</p>
          )}
        </div>
      )}
    </div>
  );
}
