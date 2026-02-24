"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTodayChallenge, isTodayCompleted } from "@/lib/daily-challenges";
import type { DailyChallenge } from "@/lib/daily-challenges";

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

interface DailyChallengePreviewProps {
  headingLabel: string;
  solveLabel: string;
  completedLabel: string;
  xpLabel: string;
}

/**
 * Compact dashboard card previewing today's daily challenge.
 */
export function DailyChallengePreview({
  headingLabel,
  solveLabel,
  completedLabel,
  xpLabel,
}: DailyChallengePreviewProps) {
  const [challenge] = useState<DailyChallenge | null>(() =>
    getTodayChallenge(),
  );
  const [done] = useState(() => isTodayCompleted());

  if (!challenge) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{headingLabel}</h2>
        <Link
          href="/challenges"
          className="flex items-center gap-1 text-sm text-st-green hover:text-st-green-light transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div
        className={cn(
          "glass rounded-xl p-4 transition-all",
          done && "border border-emerald-500/20 bg-emerald-500/5",
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <Zap
            className={cn(
              "h-4 w-4",
              done ? "text-emerald-400" : "text-primary",
            )}
          />
          <Badge
            variant="outline"
            className={cn("text-[10px]", CATEGORY_COLORS[challenge.category])}
          >
            {challenge.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize">
            {challenge.difficulty}
          </Badge>
          <span className="ml-auto text-xs font-semibold text-yellow-400">
            +{challenge.xpReward} {xpLabel}
          </span>
        </div>

        <h3 className="mb-1 font-semibold leading-tight">{challenge.title}</h3>
        <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">
          {challenge.description}
        </p>

        {done ? (
          <div className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{completedLabel}</span>
          </div>
        ) : (
          <Button asChild size="sm" className="w-full gap-2">
            <Link href="/challenges">
              <Zap className="h-3.5 w-3.5" />
              {solveLabel}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
