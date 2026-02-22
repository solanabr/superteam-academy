"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Trophy } from "@phosphor-icons/react";
import type { LeaderboardEntry } from "@superteam-lms/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Timeframe = "weekly" | "monthly" | "alltime";

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  initialTimeframe: Timeframe;
  currentUserId: string;
}

const RANK_MEDALS: Record<number, string> = {
  1: "\u{1F947}",
  2: "\u{1F948}",
  3: "\u{1F949}",
};

function truncateWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
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
        <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
          {t("leaderboard")}
        </h1>
        <p className="mt-1 text-text-3">
          {t("rank")} — {t(timeframe === "alltime" ? "allTime" : timeframe)}
        </p>
      </div>

      <Tabs value={timeframe} onValueChange={handleTimeframeChange}>
        <TabsList className="lb-tabs">
          <TabsTrigger value="weekly" className="lb-tab font-display font-bold">
            {t("weekly")}
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="lb-tab font-display font-bold"
          >
            {t("monthly")}
          </TabsTrigger>
          <TabsTrigger
            value="alltime"
            className="lb-tab font-display font-bold"
          >
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
            <div>
              {entries.map((entry) => {
                const isGold = entry.rank === 1;
                const isCurrentUser = entry.userId === currentUserId;
                const medal = RANK_MEDALS[entry.rank];
                const initials = entry.username.slice(0, 2).toUpperCase();

                return (
                  <Link
                    key={entry.userId}
                    href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
                    className="block no-underline"
                  >
                    <div
                      className={cn(
                        "lb-row",
                        isGold && "gold",
                        isCurrentUser && "me"
                      )}
                    >
                      {/* Rank */}
                      <span
                        className="lb-rank"
                        aria-label={`Rank ${entry.rank}`}
                      >
                        {medal ?? entry.rank}
                      </span>

                      {/* Avatar — gradient circle with initials */}
                      <div
                        className="lb-av"
                        style={{
                          background: entry.avatarUrl
                            ? `url(${entry.avatarUrl}) center/cover no-repeat`
                            : "linear-gradient(135deg, var(--primary), var(--xp))",
                        }}
                        aria-hidden="true"
                      >
                        {!entry.avatarUrl && <span>{initials}</span>}
                      </div>

                      {/* Info — name + wallet address */}
                      <div className="lb-info">
                        <div className="lb-name">
                          <span className="truncate">{entry.username}</span>
                          {isCurrentUser && (
                            <span className="lb-me-tag">You</span>
                          )}
                        </div>
                        {entry.walletAddress && (
                          <div className="lb-wallet">
                            {truncateWallet(entry.walletAddress)}
                          </div>
                        )}
                      </div>

                      {/* Right side — v9 level pill + XP */}
                      <div className="lb-right">
                        <span className="lb-level-badge">Lv.{entry.level}</span>
                        <span className="lb-xp">
                          {entry.totalXp.toLocaleString()} XP
                        </span>
                      </div>
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
