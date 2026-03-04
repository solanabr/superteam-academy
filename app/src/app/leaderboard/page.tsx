"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale } from "@/contexts/locale-context";
import { learningProgressService } from "@/services/learning-progress";
import type { LeaderboardEntry } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Zap,
} from "lucide-react";

const RANK_COLORS = [
  "from-amber-500 to-yellow-500",
  "from-slate-400 to-slate-300",
  "from-orange-600 to-amber-600",
];


export default function LeaderboardPage() {
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "all-time">(
    "all-time"
  );
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    const load = async () => {
      const data = await learningProgressService.getLeaderboard(timeframe);
      setEntries(data);
    };
    load();
  }, [timeframe]);

  const userWallet = publicKey?.toBase58() ?? "";

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Trophy className="mb-4 h-12 w-12 text-amber-500" />
            <h1 className="text-3xl font-bold sm:text-4xl">
              {t("leaderboard.title")}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {t("leaderboard.subtitle")}
            </p>

            <Tabs
              value={timeframe}
              onValueChange={(v) =>
                setTimeframe(v as "weekly" | "monthly" | "all-time")
              }
              className="mt-6"
            >
              <TabsList>
                <TabsTrigger value="weekly">
                  {t("leaderboard.weekly")}
                </TabsTrigger>
                <TabsTrigger value="monthly">
                  {t("leaderboard.monthly")}
                </TabsTrigger>
                <TabsTrigger value="all-time">
                  {t("leaderboard.allTime")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="mb-10 grid grid-cols-3 gap-4">
            {[1, 0, 2].map((rankIndex) => {
              const entry = entries[rankIndex];
              const isCenter = rankIndex === 0;
              return (
                <div
                  key={entry.wallet}
                  className={`flex flex-col items-center ${isCenter ? "-mt-4" : "mt-4"}`}
                >
                  <div
                    className={`relative mb-3 rounded-full bg-gradient-to-br p-0.5 ${RANK_COLORS[rankIndex]}`}
                  >
                    <Avatar
                      className={`${isCenter ? "h-20 w-20" : "h-16 w-16"} border-2 border-background`}
                    >
                      <AvatarFallback className="bg-card text-lg font-bold">
                        {entry.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${RANK_COLORS[rankIndex]} text-xs font-bold text-white`}
                      >
                        {rankIndex + 1}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {entry.displayName}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-violet-500">
                    <Zap className="h-3.5 w-3.5" />
                    {entry.xp.toLocaleString()}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    Lv.{entry.level}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Rankings Table */}
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground">
                <div className="col-span-1">{t("leaderboard.rank")}</div>
                <div className="col-span-5">{t("leaderboard.learner")}</div>
                <div className="col-span-2 text-right">
                  {t("leaderboard.xp")}
                </div>
                <div className="col-span-2 text-right">
                  {t("leaderboard.levelCol")}
                </div>
                <div className="col-span-2 text-right">
                  {t("leaderboard.courses")}
                </div>
              </div>

              {/* Rows */}
              {entries.map((entry) => {
                const isUser = entry.wallet.includes(
                  userWallet?.slice(0, 4) ?? "---"
                );
                return (
                  <div
                    key={entry.wallet}
                    className={`grid grid-cols-12 items-center gap-4 px-6 py-3 transition-colors hover:bg-accent/50 ${
                      isUser ? "bg-violet-500/5" : ""
                    }`}
                  >
                    <div className="col-span-1">
                      <span
                        className={`text-sm font-bold ${
                          entry.rank <= 3
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {entry.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">
                          {entry.displayName}
                        </span>
                        {isUser && (
                          <Badge
                            className="ml-2 bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px] px-1.5 py-0"
                          >
                            {t("leaderboard.you")}
                          </Badge>
                        )}
                        <p className="font-mono text-xs text-muted-foreground">
                          {entry.wallet}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1 text-sm">
                      <Zap className="h-3.5 w-3.5 text-violet-500" />
                      <span className="font-medium">
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      {entry.level}
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      {entry.coursesCompleted}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
