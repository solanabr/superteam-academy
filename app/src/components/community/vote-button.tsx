"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  count: number;
  threadId?: string;
  replyId?: string;
  wallet: string | null;
  className?: string;
}

export function VoteButton({ count, threadId, replyId, wallet, className }: VoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const [localCount, setLocalCount] = useState(count);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async () => {
    if (!wallet || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/community/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, threadId, replyId }),
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.voted) {
        setVoted(true);
        setLocalCount((c) => c + 1);
      } else {
        setVoted(false);
        setLocalCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!wallet || submitting}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-[2px] border px-2 py-1.5 transition-all duration-150",
        voted
          ? "border-[#55E9AB]/40 bg-[#55E9AB]/10 text-[#55E9AB]"
          : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text)]",
        !wallet && "opacity-40 cursor-not-allowed",
        submitting && "opacity-60",
        className,
      )}
    >
      <ArrowUp className={cn("h-4 w-4", voted && "fill-current")} />
      <span className="font-mono text-xs">{localCount}</span>
    </button>
  );
}
