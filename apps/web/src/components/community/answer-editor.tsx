"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MarkdownEditor } from "./markdown-editor";
import { Button } from "@/components/ui/button";

interface AnswerEditorProps {
  threadId: string;
  onAnswerPosted: () => void;
}

export function AnswerEditor({ threadId, onAnswerPosted }: AnswerEditorProps) {
  const t = useTranslations("community");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!body.trim() || body.length < 1) return;
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
      onAnswerPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ONE composer block: the editor and its submit share a single frame, with
    // the button bottom-right inside it. No "Your Answer" heading — the
    // section's "Answers (N)" header above already says where you are.
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--card)]">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder={t("writeAnswer")}
        minHeight="110px"
        flush
      />
      {error && (
        <p className="px-3 pt-2 text-sm text-[var(--danger)]">{error}</p>
      )}
      <div className="flex justify-end border-t border-[var(--border-default)] px-3 py-2">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
        >
          {isSubmitting && (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          {t("postAnswer")}
        </Button>
      </div>
    </div>
  );
}
