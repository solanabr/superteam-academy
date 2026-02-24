"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SpeedLeaderboardEntry } from "@/lib/daily-challenges";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function truncateWallet(wallet: string): string {
  return wallet.slice(0, 4) + "..." + wallet.slice(-4);
}

interface SpeedLeaderboardProps {
  labels: {
    speedLeaderboard: string;
    noCompletionsYet: string;
    rank: string;
    user: string;
    timeToComplete: string;
    tests: string;
  };
  currentUserId?: string;
}

export function SpeedLeaderboard({
  labels,
  currentUserId,
}: SpeedLeaderboardProps) {
  const [entries, setEntries] = useState<SpeedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-challenges/leaderboard")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="text-xl font-semibold">{labels.speedLeaderboard}</h2>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-5 w-6" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="ml-auto h-5 w-14" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {labels.noCompletionsYet}
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span className="w-8">{labels.rank}</span>
              <span className="flex-1">{labels.user}</span>
              <span className="w-16 text-right">{labels.timeToComplete}</span>
              <span className="w-12 text-right">{labels.tests}</span>
            </div>

            {/* Rows */}
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0",
                    isCurrentUser &&
                      "bg-st-green/10 border-l-2 border-l-st-green",
                  )}
                >
                  <span className="w-8 font-mono text-xs text-muted-foreground">
                    {entry.rank <= 3
                      ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                      : `#${entry.rank}`}
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {entry.displayName ||
                      (entry.wallet
                        ? truncateWallet(entry.wallet)
                        : "Anonymous")}
                  </span>
                  <span className="w-16 text-right font-mono text-xs tabular-nums">
                    {formatTime(entry.timeSeconds)}
                  </span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {entry.testsPassed}/{entry.totalTests}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
