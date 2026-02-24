"use client";

import { useDailyChallenges } from "@/lib/hooks/use-daily-challenges";
import { ChallengeCard } from "./challenge-card";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyChallengesProps {
  className?: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function DailyChallenges({ className }: DailyChallengesProps) {
  const { challenges, timeUntilReset, claimReward, loading } =
    useDailyChallenges();

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded-[2px] bg-[var(--c-border-subtle)] animate-pulse" />
          <div className="h-4 w-20 rounded-[2px] bg-[var(--c-border-subtle)] animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--c-text-2)]"
          style={{ fontFamily: "var(--font-body, 'Space Grotesk', sans-serif)" }}
        >
          Daily Challenges
        </h3>
        <div className="flex items-center gap-1.5 text-[var(--c-text-muted)]">
          <Timer className="w-3 h-3" />
          <span className="font-mono text-[11px] tabular-nums">
            {formatCountdown(timeUntilReset)}
          </span>
        </div>
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onClaim={claimReward}
          />
        ))}
      </div>

      {/* Completion summary */}
      {challenges.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--c-border-subtle)]">
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--c-text-muted)]">
            {challenges.filter((c) => c.completed).length}/{challenges.length}{" "}
            completed
          </span>
          <span className="font-mono text-[11px] text-[var(--c-text-2)]">
            {challenges
              .filter((c) => !!c.claimedAt)
              .reduce((sum, c) => sum + c.xpReward, 0)}{" "}
            /{" "}
            {challenges.reduce((sum, c) => sum + c.xpReward, 0)} XP claimed
          </span>
        </div>
      )}
    </section>
  );
}
