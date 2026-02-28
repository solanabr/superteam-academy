"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";
import { createReply } from "@/lib/forum";

interface ReplyFormProps {
  threadId: string;
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!connected || !publicKey) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-card border border-border rounded">
        <p className="text-xs font-mono text-muted-foreground">
          Connect your wallet to reply.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="shrink-0 inline-flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-xs px-3 py-1.5 rounded hover:bg-[#0D9E61] transition-colors"
        >
          <span>◎</span> Connect Wallet
        </button>
      </div>
    );
  }

  const authorWallet = publicKey.toBase58();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!body.trim()) {
      setError("Reply cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await createReply({
        threadId,
        authorWallet,
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Author pill */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#14F195]">◎</span>
        <span className="text-muted-foreground">Replying as</span>
        <span className="text-foreground">
          {authorWallet.slice(0, 6)}...{authorWallet.slice(-4)}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply..."
        rows={5}
        className="w-full bg-background border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors resize-y"
        required
      />

      {error && (
        <div className="px-3 py-2.5 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded text-xs font-mono text-[#FF4444]">
          {error}
        </div>
      )}

      {success && (
        <div className="px-3 py-2.5 bg-[#14F195]/10 border border-[#14F195]/30 rounded text-xs font-mono text-[#14F195]">
          Reply posted.
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
