"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MarkdownEditor } from "./markdown-editor";
import { Button } from "@/components/ui/button";

interface AnswerEditorProps {
  threadId: string;
  onAnswerPosted: () => void;
}

export function AnswerEditor({ threadId, onAnswerPosted }: AnswerEditorProps) {
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
        Your Answer
      </h3>
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="Write your answer using Markdown..."
        minHeight="150px"
      />
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Post Answer
        </Button>
      </div>
    </div>
  );
}
