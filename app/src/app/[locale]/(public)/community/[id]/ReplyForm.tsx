"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createReply } from "@/lib/forum";

interface ReplyFormProps {
  threadId: string;
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [authorWallet, setAuthorWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!body.trim() || !authorWallet.trim()) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await createReply({
        threadId,
        authorWallet: authorWallet.trim(),
        body: body.trim(),
      });

      if (!ok) {
        setError("Failed to post reply. Please try again.");
        return;
      }

      setBody("");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-widest">
          Your wallet / display name
        </label>
        <input
          type="text"
          value={authorWallet}
          onChange={(e) => setAuthorWallet(e.target.value)}
          placeholder="e.g. 7xKp...3mRt or yourname.sol"
          className="w-full bg-background border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-widest">
          Reply
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply..."
          rows={5}
          className="w-full bg-background border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors resize-y"
          required
        />
      </div>

      {error && (
        <div className="px-3 py-2.5 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded text-xs font-mono text-[#FF4444]">
          {error}
        </div>
      )}

      {success && (
        <div className="px-3 py-2.5 bg-[#14F195]/10 border border-[#14F195]/30 rounded text-xs font-mono text-[#14F195]">
          Reply posted successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-[#0D9E61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post Reply"}
        </button>
      </div>
    </form>
  );
}
