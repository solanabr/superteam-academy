"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/gamification/level-badge";
import { useLeaderboard } from "@/hooks/use-xp";
import { cn } from "@/lib/utils";

const TIME_FILTERS = ["allTime", "thisMonth", "thisWeek"] as const;

const PODIUM_STYLES = [
  "from-yellow-400/20 to-yellow-600/5 border-yellow-500/30",
  "from-zinc-300/20 to-zinc-500/5 border-zinc-400/30",
  "from-orange-400/20 to-orange-600/5 border-orange-500/30",
];

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { publicKey } = useWallet();
  const [filter, setFilter] = useState<(typeof TIME_FILTERS)[number]>("allTime");
  const { data: entries, isLoading } = useLeaderboard(100);

  const walletAddress = publicKey?.toBase58();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Time Filters */}
      <div className="flex gap-2">
        {TIME_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {!isLoading && entries && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = entries[podiumIdx];
            if (!entry) return null;
            const short = `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`;
            return (
              <Card
                key={entry.wallet}
                className={cn(
                  "border bg-gradient-to-b text-center",
                  PODIUM_STYLES[podiumIdx],
                  podiumIdx === 0 && "md:-mt-4"
                )}
              >
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">
                    {podiumIdx === 0 ? "🥇" : podiumIdx === 1 ? "🥈" : "🥉"}
                  </div>
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarFallback>{short.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <p className="font-mono text-xs mb-1">{short}</p>
                  <p className="font-bold text-lg">{entry.xp.toLocaleString()} XP</p>
                  <LevelBadge level={entry.level} size="sm" className="mx-auto mt-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="p-3 text-left w-16">{t("rank")}</th>
                <th className="p-3 text-left">{t("user")}</th>
                <th className="p-3 text-right">{t("xp")}</th>
                <th className="p-3 text-right hidden sm:table-cell">{t("level")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-3" colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                : entries?.map((entry) => {
                    const short = `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`;
                    const isYou = entry.wallet === walletAddress;
                    return (
                      <tr
                        key={entry.wallet}
                        className={cn(
                          "border-b border-border/50 transition-colors hover:bg-accent/50",
                          isYou && "bg-primary/5"
                        )}
                      >
                        <td className="p-3 font-mono text-sm">
                          #{entry.rank}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {short.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-mono text-sm">{short}</span>
                            {isYou && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {t("you")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {entry.xp.toLocaleString()}
                        </td>
                        <td className="p-3 text-right hidden sm:table-cell">
                          <LevelBadge level={entry.level} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
