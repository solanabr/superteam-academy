"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoteValue } from "@/types";

interface VoteButtonsProps {
  score: number;
  userVote: VoteValue;
  onVote: (value: 1 | -1) => void;
  compact?: boolean;
}

export function VoteButtons({ score, userVote, onVote, compact }: VoteButtonsProps) {
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onVote(1)}
        className={cn(
          "rounded p-1 transition-colors hover:text-green-400",
          userVote === 1 ? "text-green-400" : "text-muted-foreground",
        )}
        aria-label="Upvote"
      >
        <ThumbsUp className={iconSize} />
      </button>
      <span className={cn(
        "font-semibold tabular-nums text-foreground",
        compact ? "text-xs" : "text-sm",
      )}>
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        className={cn(
          "rounded p-1 transition-colors hover:text-red-400",
          userVote === -1 ? "text-red-400" : "text-muted-foreground",
        )}
        aria-label="Downvote"
      >
        <ThumbsDown className={iconSize} />
      </button>
    </div>
  );
}
