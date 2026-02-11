"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Trophy } from "@phosphor-icons/react";
import type { LeaderboardEntry } from "@superteam-lms/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getLevelTier } from "@/components/gamification/level-badge";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "alltime";

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  initialTimeframe: Timeframe;
  currentUserId: string;
}

export function LeaderboardClient({
  initialEntries,
  initialTimeframe,
  currentUserId,
}: LeaderboardClientProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (tf: Timeframe) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${tf}`);
      if (!res.ok) {
        setEntries([]);
        return;
      }
      const { entries: leaderboard } = (await res.json()) as {
        entries: LeaderboardEntry[];
      };
      setEntries(leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTimeframeChange = useCallback(
    (newTimeframe: string) => {
      const tf = newTimeframe as Timeframe;
      setTimeframe(tf);
      fetchLeaderboard(tf);
    },
    [fetchLeaderboard]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("leaderboard")}</h1>
        <p className="mt-1 text-text-3">
          {t("rank")} — {t(timeframe === "alltime" ? "allTime" : timeframe)}
        </p>
      </div>

      <Tabs value={timeframe} onValueChange={handleTimeframeChange}>
        <TabsList>
          <TabsTrigger value="weekly" className="font-display font-bold">
            {t("weekly")}
          </TabsTrigger>
          <TabsTrigger value="monthly" className="font-display font-bold">
            {t("monthly")}
          </TabsTrigger>
          <TabsTrigger value="alltime" className="font-display font-bold">
            {t("allTime")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={timeframe} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy
                  size={48}
                  weight="bold"
                  className="mb-3 text-text-3"
                  aria-hidden="true"
                />
                <p className="text-text-3">{t("noEntries")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isFirst = entry.rank === 1;
                const isCurrentUser = entry.userId === currentUserId;
                const tier = getLevelTier(entry.level);

                return (
                  <Link
                    key={entry.userId}
                    href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
                    className="group block"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3.5 rounded-[14px] border-[2.5px] px-4 py-3.5 shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-card-hover",
                        isCurrentUser
                          ? "border-primary bg-primary-bg"
                          : isFirst
                            ? "border-accent bg-accent-bg"
                            : "border-border bg-card"
                      )}
                    >
                      {/* Rank */}
                      <span
                        className={cn(
                          "w-7 font-display text-lg font-black",
                          isFirst
                            ? "text-accent-dark dark:text-accent"
                            : "text-text-3"
                        )}
                      >
                        {entry.rank}
                      </span>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        {entry.avatarUrl && (
                          <AvatarImage
                            src={entry.avatarUrl}
                            alt={entry.username}
                          />
                        )}
                        <AvatarFallback className="font-display text-sm font-bold">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[15px] font-bold transition-colors group-hover:text-primary">
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-1 text-[11px] font-extrabold text-primary">
                              ({t("yourRank")})
                            </span>
                          )}
                        </p>
                        <p className="font-body text-xs text-text-3">
                          {t("level")} {entry.level} · {t(`tier_${tier}`)}
                        </p>
                      </div>

                      {/* XP */}
                      <span className="font-display text-base font-black text-accent-dark dark:text-accent">
                        {entry.totalXp.toLocaleString()} {t("xp")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
