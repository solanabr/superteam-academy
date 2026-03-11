"use client";

import { useTranslations } from "next-intl";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
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
  const t = useTranslations("community");
  const iconSize = size === "sm" ? 18 : 22;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={cn(
          "flex items-center justify-center rounded-md p-2 transition-colors hover:bg-[var(--primary-dim)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          userVote === 1
            ? "text-[var(--primary)]"
            : "text-[var(--text-2)] hover:text-[var(--primary)]"
        )}
        aria-label={t("upvote")}
      >
        <CaretUp size={iconSize} weight={userVote === 1 ? "fill" : "bold"} />
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
          "flex items-center justify-center rounded-md p-2 transition-colors hover:bg-[var(--danger-light)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          userVote === -1
            ? "text-[var(--danger)]"
            : "text-[var(--text-2)] hover:text-[var(--danger)]"
        )}
        aria-label={t("downvote")}
      >
        <CaretDown size={iconSize} weight={userVote === -1 ? "fill" : "bold"} />
      </button>
    </div>
  );
}
