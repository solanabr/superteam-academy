"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeaderboard } from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import type { LeaderboardTimeframe } from "@/types";
import { Trophy, Medal, Zap } from "lucide-react";

const timeframes: { key: LeaderboardTimeframe; labelKey: string }[] = [
  { key: "weekly", labelKey: "weekly" },
  { key: "monthly", labelKey: "monthly" },
  { key: "all-time", labelKey: "allTime" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <Trophy className="h-4 w-4" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/20 text-slate-500">
        <Medal className="h-4 w-4" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
        <Medal className="h-4 w-4" />
      </div>
    );
  return (
    <div className="flex h-8 w-8 items-center justify-center text-sm font-medium text-muted-foreground">
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
  const { entries, total, loading } = useLeaderboard(timeframe);
  const { profile } = useAuth();
  // Only highlight "You" for the user's linked wallet
  const myWallet = profile?.walletAddress ?? "";

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Timeframe toggle */}
        <div className="flex gap-2 mb-6">
          {timeframes.map((tf) => (
            <Button
              key={tf.key}
              variant={timeframe === tf.key ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setTimeframe(tf.key)}
            >
              {t(tf.labelKey)}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">
            {total} participants
          </span>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[56px_1fr_80px_60px] sm:grid-cols-[56px_1fr_100px_80px] gap-2 px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
            <span>{t("rank")}</span>
            <span>{t("learner")}</span>
            <span className="text-right">{t("xp")}</span>
            <span className="text-right">{t("level")}</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[56px_1fr_80px_60px] sm:grid-cols-[56px_1fr_100px_80px] gap-2 px-4 py-3 items-center"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12 ml-auto" />
                  <Skeleton className="h-4 w-8 ml-auto" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No entries yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => {
                const isYou = !!myWallet && entry.walletAddress === myWallet;
                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-[56px_1fr_80px_60px] sm:grid-cols-[56px_1fr_100px_80px] gap-2 px-4 py-3 items-center transition-colors ${
                      isYou ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <RankBadge rank={entry.rank} />
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(entry.displayName ?? entry.username ?? "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.displayName ?? entry.username ?? "Anonymous"}
                          {isYou && (
                            <Badge
                              variant="secondary"
                              className="ml-1.5 text-[10px] px-1.5 py-0"
                            >
                              {t("you")}
                            </Badge>
                          )}
                        </p>
                        {entry.walletAddress && (
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {entry.walletAddress.slice(0, 4)}...
                            {entry.walletAddress.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold flex items-center justify-end gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {entry.level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}
