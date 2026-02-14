"use client";

import { useState } from "react";
import { Trophy, Flame, Zap, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useXP } from "@/lib/hooks/use-service";
import { useWallet } from "@solana/wallet-adapter-react";
import { getLevel } from "@/lib/utils";

const TIMEFRAMES = [
  { value: "weekly" as const, label: "This Week" },
  { value: "monthly" as const, label: "This Month" },
  { value: "all-time" as const, label: "All Time" },
];

const PODIUM_COLORS = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-amber-600 to-amber-700",
];

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "all-time">("all-time");
  const { data: entries, isLoading } = useLeaderboard(timeframe);
  const { publicKey } = useWallet();
  const { data: myXP } = useXP();
  const walletAddress = publicKey?.toBase58();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-xp-gold" /> Leaderboard
          </h1>
          <p className="mt-1 text-muted-foreground">Top learners ranked by XP</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeframe === tf.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No rankings yet</h2>
            <p className="text-muted-foreground">Complete lessons to earn XP and appear on the leaderboard.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium — only when 3+ users */}
          {entries.length >= 3 && (
            <div className="mb-8 flex items-end justify-center gap-3 sm:gap-6">
              {[1, 0, 2].map((podiumIndex) => {
                const entry = entries[podiumIndex];
                const isFirst = podiumIndex === 0;
                return (
                  <div key={podiumIndex} className={`flex flex-col items-center ${isFirst ? "order-2" : podiumIndex === 1 ? "order-1" : "order-3"}`}>
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${PODIUM_COLORS[podiumIndex]} ${isFirst ? "h-20 w-20" : ""}`}>
                      <span className="text-lg font-bold text-white">{entry.displayName?.[0] ?? entry.wallet[0]}</span>
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-current text-xs font-bold">
                        {podiumIndex + 1}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold truncate max-w-[80px] sm:max-w-[120px]">
                      {entry.displayName ?? `${entry.wallet.slice(0, 4)}...`}
                    </p>
                    <p className="text-xs text-xp-gold font-medium">{entry.xp.toLocaleString()} XP</p>
                    <div className={`mt-2 w-20 sm:w-24 rounded-t-lg bg-gradient-to-br ${PODIUM_COLORS[podiumIndex]} ${isFirst ? "h-24" : podiumIndex === 1 ? "h-16" : "h-12"}`} />
                  </div>
                );
              })}
            </div>
          )}

          {/* All entries as table (skip top 3 if podium is shown) */}
          <div className="space-y-2">
            {(entries.length >= 3 ? entries.slice(3) : entries).map((entry) => {
              const isCurrentUser = walletAddress === entry.wallet;
              return (
                <Card key={entry.rank} className={isCurrentUser ? "ring-2 ring-solana-purple" : ""}>
                  <CardContent className="p-3 flex items-center gap-4">
                    <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                      #{entry.rank}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                      <span className="text-sm font-bold">{entry.displayName?.[0] ?? entry.wallet[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {entry.displayName ?? `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`}
                        </p>
                        {isCurrentUser && <Badge variant="outline" className="text-[10px]">You</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="flex items-center gap-1 text-sm text-streak-orange">
                        <Flame className="h-3.5 w-3.5" /> {entry.streak}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-xp-gold min-w-[80px] justify-end">
                        <Zap className="h-3.5 w-3.5" /> {entry.xp.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Current user if not in list (0 XP or not found) */}
          {walletAddress && myXP !== undefined && myXP > 0 && !entries.some((e) => e.wallet === walletAddress) && (
            <Card className="mt-6 ring-2 ring-solana-purple">
              <CardContent className="p-3 flex items-center gap-4">
                <span className="w-8 text-center text-sm font-bold text-muted-foreground">—</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solana-purple/10 shrink-0">
                  <Medal className="h-5 w-5 text-solana-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                    <Badge variant="outline" className="text-[10px]">You</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Level {getLevel(myXP)}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-xp-gold">
                  <Zap className="h-3.5 w-3.5" /> {myXP.toLocaleString()}
                </span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
