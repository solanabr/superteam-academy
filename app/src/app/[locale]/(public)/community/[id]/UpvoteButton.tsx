"use client";

import { useState } from "react";
import { toggleVote } from "@/lib/forum";

interface UpvoteButtonProps {
  threadId: string;
  initialCount: number;
}

export function UpvoteButton({ threadId, initialCount }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      const newCount = await toggleVote(threadId, `anon_${Math.random().toString(36).slice(2, 8)}`);
      setCount(newCount);
      setVoted((v) => !v);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-xs transition-colors",
        voted
          ? "bg-[#14F195]/10 border-[#14F195]/40 text-[#14F195]"
          : "bg-card border-border text-muted-foreground hover:border-border-hover hover:text-foreground",
        loading ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
      title="Upvote this thread"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M6 1L11 7H7V11H5V7H1L6 1Z"
          fill="currentColor"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
