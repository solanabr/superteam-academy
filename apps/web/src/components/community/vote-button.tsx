"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  score: number;
  userVote: 1 | -1 | null;
  onVote: (value: 0 | 1 | -1) => void;
  disabled?: boolean;
  size?: "sm" | "default";
}

export function VoteButton({
  score,
  userVote,
  onVote,
  disabled = false,
  size = "default",
}: VoteButtonProps) {
  const iconSize = size === "sm" ? 18 : 22;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={cn(
          "rounded-md p-0.5 transition-colors hover:bg-[var(--primary-dim)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          userVote === 1
            ? "text-[var(--primary)]"
            : "text-[var(--text-2)] hover:text-[var(--primary)]"
        )}
        aria-label="Upvote"
      >
        <ChevronUp size={iconSize} strokeWidth={userVote === 1 ? 3 : 2} />
      </button>

      <span
        className={cn(
          "font-display font-bold tabular-nums",
          size === "sm" ? "text-sm" : "text-base",
          score > 0 && "text-[var(--primary)]",
          score < 0 && "text-[var(--danger)]",
          score === 0 && "text-[var(--text-2)]"
        )}
      >
        {score}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={cn(
          "rounded-md p-0.5 transition-colors hover:bg-[var(--danger-light)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          userVote === -1
            ? "text-[var(--danger)]"
            : "text-[var(--text-2)] hover:text-[var(--danger)]"
        )}
        aria-label="Downvote"
      >
        <ChevronDown size={iconSize} strokeWidth={userVote === -1 ? 3 : 2} />
      </button>
    </div>
  );
}
