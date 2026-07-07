"use client";

import { useRef, useState } from "react";
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

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

/**
 * Markdown authoring field with a Write / Preview toggle for the teacher course
 * builder. The preview uses the SAME plugin set as the learner lesson page
 * (`lesson-client.tsx`: remark-gfm + rehype-raw + rehype-highlight in a `prose`
 * container) so a teacher sees exactly what the learner will. Distinct from the
 * community `MarkdownEditor`, which is bound to the community i18n namespace and
 * omits rehype-raw.
 *
 * Includes an "Insert image" control that either uploads a local file (→ Sanity
 * CDN via /api/teacher/upload-image) or takes an image URL, splicing the
 * resulting `![](url)` Markdown at the caret.
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
  const [imageMenu, setImageMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 text-xs font-medium transition-colors",
      active
        ? "border-b-2 border-primary text-primary"
        : "text-text-2 hover:text-text"
    );

  function insertAtCaret(snippet: string) {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value ? `${value}\n${snippet}` : snippet);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    // Restore focus + caret after the inserted text once React has re-rendered.
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function closeMenu() {
    setImageMenu(false);
    setImgError(null);
    setUrlValue("");
  }

  async function handleFile(file: File) {
    setUploading(true);
    setImgError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/teacher/upload-image", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setImgError(data.error ?? t("imageUploadError"));
        return;
      }
      insertAtCaret(`![](${data.url})`);
      closeMenu();
    } catch {
      setImgError(t("imageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleUrlInsert() {
    const url = urlValue.trim();
    if (!/^https:\/\/\S+$/i.test(url)) {
      setImgError(t("imageUrlInvalid"));
      return;
    }
    setUploading(true);
    setImgError(null);
    try {
      // Import server-side (fetch + pin to Sanity) so the resulting
      // cdn.sanity.io URL renders under the lesson CSP — a raw foreign URL
      // would be blocked.
      const res = await fetch("/api/teacher/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setImgError(data.error ?? t("imageUploadError"));
        return;
      }
      insertAtCaret(`![](${data.url})`);
      closeMenu();
    } catch {
      setImgError(t("imageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className
      )}
    >
      <div
        className="flex items-center border-b border-border bg-[var(--surface)]"
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

        {tab === "write" && (
          <div className="relative ml-auto pr-1.5">
            <button
              type="button"
              onClick={() => {
                setImageMenu((v) => !v);
                setImgError(null);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-text-2 hover:bg-subtle hover:text-text"
              aria-haspopup="dialog"
              aria-expanded={imageMenu}
            >
              🖼 {t("insertImage")}
            </button>

            {imageMenu && (
              <div
                role="dialog"
                aria-label={t("insertImage")}
                className="absolute right-0 z-10 mt-1 w-72 space-y-2 rounded-md border border-border bg-card p-3 text-sm shadow-card"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  {uploading ? t("uploading") : t("uploadFromComputer")}
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder={t("imageUrl")}
                    className="min-w-0 flex-1 rounded-md border border-border bg-[var(--input)] px-2 py-1.5 text-xs text-text"
                    aria-label={t("imageUrl")}
                  />
                  <button
                    type="button"
                    disabled={uploading || !urlValue.trim()}
                    onClick={() => void handleUrlInsert()}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text disabled:opacity-50"
                  >
                    {t("insert")}
                  </button>
                </div>

                <p className="text-[11px] text-text-3">{t("imageHint")}</p>
                {imgError && (
                  <p className="text-[11px] text-danger">{imgError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
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
