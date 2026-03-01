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
    <div>
      <h3 className="mb-2 font-display font-bold text-[var(--text)]">
        {t("yourAnswer")}
      </h3>
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder={t("writeAnswer")}
        minHeight="150px"
      />
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
        >
          {isSubmitting && (
            <div className="sol-spinner !h-4 !w-4" aria-hidden="true" />
          )}
          {t("postAnswer")}
        </Button>
      </div>
    </div>
  );
}
