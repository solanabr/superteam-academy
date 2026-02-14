"use client";

import { useState } from "react";
import { Trophy, Flame, Zap, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useXP } from "@/lib/hooks/use-service";
import { getLevel, formatXP, shortenAddress, cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

const PODIUM_COLORS = ["text-xp-gold", "text-gray-400", "text-amber-700"];
const PODIUM_BG = ["bg-xp-gold/10", "bg-gray-400/10", "bg-amber-700/10"];

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "all-time">("all-time");
  const { data: entries, isLoading } = useLeaderboard(timeframe);
  const { publicKey } = useWallet();
  const { data: myXP } = useXP();

  const topThree = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">Top learners ranked by XP earned on-chain.</p>
      </div>

      <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
        <TabsList className="mb-6">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={timeframe}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length >= 3 && (
                <div className="mb-8 grid grid-cols-3 gap-4">
                  {[1, 0, 2].map((idx) => {
                    const entry = topThree[idx];
                    return (
                      <Card key={entry.rank} className={cn("text-center", idx === 0 && "sm:-mt-4")}>
                        <CardContent className="p-6">
                          <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-3", PODIUM_BG[idx])}>
                            {idx === 0 ? (
                              <Trophy className={cn("h-6 w-6", PODIUM_COLORS[idx])} />
                            ) : (
                              <Medal className={cn("h-6 w-6", PODIUM_COLORS[idx])} />
                            )}
                          </div>
                          <p className="text-lg font-bold">#{entry.rank}</p>
                          <p className="font-medium mt-1">{entry.displayName ?? shortenAddress(entry.wallet)}</p>
                          <p className="text-sm text-xp-gold font-semibold mt-1">{formatXP(entry.xp)} XP</p>
                          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Lvl {entry.level}</span>
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-streak-orange" /> {entry.streak}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Rest of leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rankings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {rest.map((entry) => {
                      const isMe = publicKey?.toBase58() === entry.wallet;
                      return (
                        <div key={entry.rank} className={cn("flex items-center gap-4 px-6 py-3", isMe && "bg-solana-purple/5")}>
                          <span className="w-8 text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{(entry.displayName ?? entry.wallet).slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.displayName ?? shortenAddress(entry.wallet)}
                              {isMe && <Badge variant="outline" className="ml-2 text-[10px]">You</Badge>}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-xp-gold">
                              <Zap className="h-3.5 w-3.5" /> {formatXP(entry.xp)}
                            </span>
                            <span className="text-muted-foreground w-12 text-right">Lvl {entry.level}</span>
                            <span className="flex items-center gap-1 text-muted-foreground w-12">
                              <Flame className="h-3.5 w-3.5 text-streak-orange" /> {entry.streak}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Current user's position */}
              {publicKey && myXP !== undefined && (
                <Card className="mt-4">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">Your Position</p>
                      <p className="text-xs text-muted-foreground">{shortenAddress(publicKey.toBase58())}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xp-gold font-bold">{formatXP(myXP)} XP</span>
                      <Badge>Level {getLevel(myXP)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
