"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getRecentChallenges,
  loadCompletions,
  type DailyChallenge,
  type DailyChallengeCompletion,
} from "@/lib/daily-challenges";

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

const DIFFICULTY_COLORS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "text-emerald-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

interface PastChallengesProps {
  headingLabel: string;
  completedLabel: string;
  xpLabel: string;
  lockedLabel: string;
}

/** Displays the last 6 daily challenges with completion status. */
export function PastChallenges({
  headingLabel,
  completedLabel,
  xpLabel,
  lockedLabel,
}: PastChallengesProps) {
  const [now] = useState(() => Date.now());
  const [challenges] = useState<DailyChallenge[]>(() => getRecentChallenges(6));
  const [completions] = useState<DailyChallengeCompletion[]>(() => loadCompletions());

  if (challenges.length === 0) return null;

  // Build date keys for the last 6 days
  const today = Math.floor(now / 86_400_000);
  const dateKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date((today - i - 1) * 86_400_000);
    return d.toISOString().slice(0, 10);
  });

  const completionMap = new Map(completions.map((c) => [c.date, c]));

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{headingLabel}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge, i) => {
          const dateKey = dateKeys[i];
          const completion = completionMap.get(dateKey);
          const isDone = !!completion;

          return (
            <div
              key={`${challenge.id}-${dateKey}`}
              className={cn(
                "glass rounded-xl p-4 transition-all",
                isDone
                  ? "border border-emerald-500/20 bg-emerald-500/5"
                  : "opacity-60 hover:opacity-80",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">{dateKey}</span>
                {isDone ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{completedLabel}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>{lockedLabel}</span>
                  </div>
                )}
              </div>

              <h3 className="mb-2 font-medium leading-tight">{challenge.title}</h3>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", CATEGORY_COLORS[challenge.category])}
                >
                  {challenge.category}
                </Badge>
                <span
                  className={cn(
                    "text-[10px] font-medium capitalize",
                    DIFFICULTY_COLORS[challenge.difficulty],
                  )}
                >
                  {challenge.difficulty}
                </span>
                {isDone && completion && (
                  <span className="ml-auto text-[10px] font-semibold text-emerald-400">
                    +{completion.xpEarned} {xpLabel}
                  </span>
                )}
                {!isDone && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    +{challenge.xpReward} {xpLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
