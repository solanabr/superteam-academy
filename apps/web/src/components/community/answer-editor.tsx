"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mirrors the answers route's body limit: the POST 400s past this, so the box
 *  stops accepting text at exactly the same boundary. */
const MAX_ANSWER_CHARS = 10000;

interface AnswerEditorProps {
  threadId: string;
  onAnswerPosted: () => void;
}

/**
 * The inline reply box — the lesson pane's comment-composer idiom, not a
 * boxed editor. One field that starts at a single row and grows, a lightweight
 * Preview text-toggle instead of a tab bar, the counter inline beside the
 * submit, and a compact primary button. Markdown still renders through the same
 * ReactMarkdown pipeline the thread and answers use (no rehypeRaw).
 */
export function AnswerEditor({ threadId, onAnswerPosted }: AnswerEditorProps) {
  const t = useTranslations("community");
  const [body, setBody] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const counterId = useId();
  /**
   * Re-entrancy guard. `isSubmitting` disables the button, but a second submit
   * can still land in the same tick (Enter held, double click, a stale event)
   * before React has re-rendered with the disabled prop — that posted the
   * answer twice.
   */
  const inFlight = useRef(false);

  const nearLimit = body.length / MAX_ANSWER_CHARS > 0.9;
  const canPost = body.trim().length > 0 && !isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (inFlight.current || !body.trim()) return;
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post answer");
      }

      setBody("");
      setIsPreview(false);
      onAnswerPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post answer");
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }, [body, threadId, onAnswerPosted]);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {t("answerLabel")}
      </label>

      {isPreview ? (
        <div
          className="prose prose-sm min-h-[44px] max-w-none rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-[var(--text)] dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-h4:text-sm"
          data-testid="answer-preview"
        >
          {body ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {body}
            </ReactMarkdown>
          ) : (
            <p className="italic text-[var(--text-2)]">
              {t("nothingToPreview")}
            </p>
          )}
        </div>
      ) : (
        <textarea
          id={inputId}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_ANSWER_CHARS))}
          maxLength={MAX_ANSWER_CHARS}
          rows={1}
          aria-describedby={counterId}
          disabled={isSubmitting}
          placeholder={t("writeAnswer")}
          className="min-h-[44px] w-full resize-y rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        {/* A quiet text-button, not a tab bar: preview is an occasional check,
            not a mode you live in. */}
        <button
          type="button"
          onClick={() => setIsPreview((v) => !v)}
          aria-pressed={isPreview}
          className="rounded text-xs font-medium text-[var(--text-2)] transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isPreview ? t("write") : t("preview")}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span
            id={counterId}
            className={cn(
              "text-[11px] tabular-nums",
              nearLimit ? "text-[var(--danger)]" : "text-[var(--text-2)]"
            )}
          >
            {body.length}/{MAX_ANSWER_CHARS}
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canPost}
            aria-busy={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
            ) : (
              <PaperPlaneRight size={14} weight="duotone" aria-hidden="true" />
            )}
            {t("postAnswer")}
          </Button>
        </div>
      </div>
    </form>
  );
}
