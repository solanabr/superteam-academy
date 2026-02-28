"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "@/i18n/navigation";
import { createThread } from "@/lib/forum";
import type { ForumCategory } from "@/lib/forum";
import { useProfile } from "@/hooks/useProfile";

interface NewThreadFormProps {
  categories: ForumCategory[];
}

export function NewThreadForm({ categories }: NewThreadFormProps) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const profile = useProfile();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!connected || !publicKey) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="font-mono text-sm text-muted-foreground">
          Connect your wallet to post a thread.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2.5 rounded hover:bg-[#0D9E61] transition-colors"
        >
          <span>◎</span> Connect Wallet
        </button>
      </div>
    );
  }

  const authorWallet = publicKey.toBase58();
  const authorDisplayName = profile?.display_name ?? profile?.username ?? undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim() || !categoryId) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const id = await createThread({
        categoryId,
        authorWallet,
        authorDisplayName,
        title: title.trim(),
        body: body.trim(),
      });

      if (!id) {
        setError("Failed to create thread. Please try again.");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/community/${id}` as any);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Author info */}
      <div className="flex items-center gap-2 px-3 py-2 bg-elevated border border-border rounded text-xs font-mono">
        <span className="text-[#14F195]">◎</span>
        <span className="text-muted-foreground">Posting as</span>
        <span className="text-foreground">
          {authorDisplayName ?? `${authorWallet.slice(0, 6)}...${authorWallet.slice(-4)}`}
        </span>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-widest">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-elevated border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none transition-colors"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-widest">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question or topic?"
          maxLength={200}
          className="w-full bg-elevated border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
          required
        />
        <div className="text-right text-[10px] font-mono text-muted-foreground mt-1">
          {title.length}/200
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-widest">
          Body{" "}
          <span className="normal-case text-[10px] text-muted-foreground/70">
            (markdown supported)
          </span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your question in detail. Include relevant code snippets, error messages, or context."
          rows={10}
          className="w-full bg-elevated border border-border focus:border-[#14F195]/50 rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors resize-y"
          required
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2.5 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded text-xs font-mono text-[#FF4444]">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/community")}
          className="px-4 py-2 bg-transparent border border-border text-muted-foreground font-mono text-sm rounded hover:border-border-hover hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-[#0D9E61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post Thread"}
        </button>
      </div>
    </form>
  );
}
