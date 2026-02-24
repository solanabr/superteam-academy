"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChallengeCountdown } from "./challenge-countdown";
import type { DailyChallenge } from "@/lib/daily-challenges";

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

const DIFFICULTY_LABELS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "🟢 Beginner",
  intermediate: "🟡 Intermediate",
  advanced: "🔴 Advanced",
};

interface ChallengeOverviewCardProps {
  challenge: DailyChallenge;
  labels: {
    dailyChallenge: string;
    xpReward: string;
    nextReset: string;
    tags: string;
    startChallenge: string;
    continueChallenge: string;
    completedToday: string;
  };
}

export function ChallengeOverviewCard({
  challenge,
  labels,
}: ChallengeOverviewCardProps) {
  const [status, setStatus] = useState<"idle" | "started" | "completed">(
    "idle",
  );
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    fetch("/api/daily-challenges?mode=today")
      .then((r) => r.json())
      .then((data) => {
        if (data.completed) {
          setStatus("completed");
          setXpEarned(challenge.xpReward);
        } else if (data.startedAt) {
          setStatus("started");
        }
      })
      .catch(() => {});
  }, [challenge.xpReward]);

  return (
    <div className="glass rounded-xl p-5">
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="text-xs text-primary border-primary/30 bg-primary/5"
        >
          {labels.dailyChallenge}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-xs", CATEGORY_COLORS[challenge.category])}
        >
          {challenge.category}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {DIFFICULTY_LABELS[challenge.difficulty]}
        </Badge>
        <span className="ml-auto text-sm font-semibold text-yellow-400">
          +{challenge.xpReward} {labels.xpReward}
        </span>
      </div>

      {/* Title + description */}
      <h2 className="mb-2 text-2xl font-bold">{challenge.title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {challenge.description}
      </p>

      {/* Tags + countdown */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tag className="h-3 w-3" />
          <span className="font-medium">{labels.tags}:</span>
          {challenge.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <ChallengeCountdown label={labels.nextReset} />
      </div>

      {/* CTA */}
      <div className="mt-5">
        {status === "completed" ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">
              {labels.completedToday} — +{xpEarned} {labels.xpReward}
            </span>
          </div>
        ) : (
          <Button asChild className="gap-2">
            <Link href="/challenges/today">
              {status === "started"
                ? labels.continueChallenge
                : labels.startChallenge}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
