"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, ChevronDown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAllPastChallenges,
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

const PAGE_SIZE = 6;

interface PastChallengesProps {
  headingLabel: string;
  completedLabel: string;
  xpLabel: string;
  lockedLabel: string;
  showMoreLabel?: string;
  remainingLabel?: string;
  browseAllLabel?: string;
}

export function PastChallenges({
  headingLabel,
  completedLabel,
  xpLabel,
  lockedLabel,
  showMoreLabel = "Show More",
  remainingLabel = "remaining",
  browseAllLabel,
}: PastChallengesProps) {
  const [allChallenges] = useState(() => getAllPastChallenges());
  const [completions] = useState<DailyChallengeCompletion[]>(() => loadCompletions());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (allChallenges.length === 0) return null;

  const visible = allChallenges.slice(0, visibleCount);
  const remaining = allChallenges.length - visibleCount;
  const completionMap = new Map(completions.map((c) => [c.date, c]));

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{headingLabel}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ challenge, date }) => {
          const completion = completionMap.get(date);
          const isDone = !!completion;

          return (
            <div
              key={`${challenge.id}-${date}`}
              className={cn(
                "glass rounded-xl p-4 transition-all",
                isDone
                  ? "border border-emerald-500/20 bg-emerald-500/5"
                  : "opacity-60 hover:opacity-80",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">{date}</span>
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

      {/* Single action button — swaps after first expand */}
      <div className="mt-4 flex justify-center">
        {visibleCount <= PAGE_SIZE && remaining > 0 ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            <ChevronDown className="h-4 w-4" />
            {showMoreLabel} ({remaining} {remainingLabel})
          </Button>
        ) : browseAllLabel && visibleCount > PAGE_SIZE ? (
          <Link
            href="/challenges/browse"
            className="group flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            {browseAllLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
