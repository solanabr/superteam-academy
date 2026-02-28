"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";

interface ReplyFormProps {
  threadId: string;
  wallet: string;
  parentReplyId?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export function ReplyForm({
  threadId,
  wallet,
  parentReplyId,
  onSuccess,
  compact,
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requireAuth } = useRequireAuth();

  const submitReply = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/community/threads/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          wallet,
          parentReplyId: parentReplyId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post reply");
      }

      setContent("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    await requireAuth(submitReply);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply... (Markdown supported)"
        aria-label="Reply content"
        className={cn(
          "w-full rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:border-[#55E9AB] focus:outline-none focus:ring-1 focus:ring-[#55E9AB] resize-none",
          compact ? "min-h-[60px]" : "min-h-[100px]",
        )}
      />

      {error && (
        <p className="text-xs text-[#EF4444]">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-[var(--c-text-muted)] uppercase tracking-wider">
          Markdown supported
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || submitting}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}
