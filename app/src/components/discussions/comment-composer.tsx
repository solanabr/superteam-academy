"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

interface CommentComposerProps {
  onSubmit: (body: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export function CommentComposer({ onSubmit, onCancel, placeholder, autoFocus, compact }: CommentComposerProps) {
  const t = useTranslations("discussions");
  const [body, setBody] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < 3) return;
    onSubmit(trimmed);
    setBody("");
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? t("replyPlaceholder")}
          maxLength={2000}
          autoFocus={autoFocus}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
        />
        <button
          type="submit"
          disabled={body.trim().length < 3}
          className="inline-flex items-center gap-1.5 rounded-lg bg-st-green px-3 py-2 text-sm font-medium text-white transition-all hover:bg-st-green-dark active:scale-[0.97] disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {t("reply")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("cancel")}
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder ?? t("commentPlaceholder")}
        rows={3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{body.length}/2000</p>
        <button
          type="submit"
          disabled={body.trim().length < 3}
          className="inline-flex items-center gap-1.5 rounded-lg bg-st-green px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-st-green-dark hover:shadow-md active:scale-[0.97] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {t("post")}
        </button>
      </div>
    </form>
  );
}
