"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gamificationService } from "@/services";
import { formatXP, getLevel, truncateAddress } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

export function Leaderboard() {
  const t = useTranslations("leaderboard");
  const { publicKey, connected } = useWallet();
  const [timeframe, setTimeframe] = useState<"all" | "weekly" | "monthly">("all");

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["leaderboard", timeframe],
    queryFn: () => gamificationService.getLeaderboard("weekly"),
  });

  const { data: userRankData } = useQuery({
    queryKey: ["gamification", "rank", publicKey?.toBase58()],
    queryFn: () => gamificationService.getRank(),
    enabled: connected,
  });

  const entries = leaderboardData?.data || [];
  const userRank = userRankData?.data;

  // Find user's entry
  const userEntry = entries.find(
    (e) => e.walletAddress === publicKey?.toBase58()
  );

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* User's Rank (if connected) */}
      {connected && userEntry && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">#{userEntry.rank}</div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userEntry.avatar} />
                  <AvatarFallback>
                    {userEntry.username
                      ? userEntry.username.slice(0, 2).toUpperCase()
                      : userEntry.walletAddress.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{t("yourRank")}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatXP(userEntry.xp)} XP · Level {userEntry.level}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userEntry.change !== undefined && (
                  <RankChange change={userEntry.change} />
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">View Profile</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeframe Tabs */}
      <Tabs
        defaultValue={timeframe}
        onValueChange={(v) => setTimeframe(v as any)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="weekly">{t("weekly")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
          <TabsTrigger value="all">{t("allTime")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {entries.slice(0, 3).map((entry, index) => (
          <TopThreeCard
            key={entry.walletAddress}
            entry={entry}
            position={index + 1}
            isCurrentUser={entry.walletAddress === publicKey?.toBase58()}
          />
        ))}
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                    {t("rank")}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                    {t("learner")}
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                    {t("level")}
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                    {t("xp")}
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                    {t("streak")}
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                    {t("change")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="h-12 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : (
                  entries.slice(3).map((entry) => (
                    <LeaderboardRow
                      key={entry.walletAddress}
                      entry={entry}
                      isCurrentUser={
                        entry.walletAddress === publicKey?.toBase58()
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Load More */}
      {entries.length >= 100 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
}

function TopThreeCard({
  entry,
  position,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
}) {
  const medals = {
    1: { icon: Crown, color: "text-yellow-500", bg: "from-yellow-500/20" },
    2: { icon: Medal, color: "text-gray-400", bg: "from-gray-400/20" },
    3: { icon: Medal, color: "text-amber-600", bg: "from-amber-600/20" },
  };

  const medal = medals[position as keyof typeof medals];
  const Icon = medal.icon;

  return (
    <Card
      className={`relative overflow-hidden ${
        isCurrentUser ? "ring-2 ring-primary" : ""
      } ${position === 1 ? "md:-mt-4" : ""}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-b ${medal.bg} to-transparent`}
      />
      <CardContent className="relative p-6 text-center">
        <Icon className={`h-8 w-8 mx-auto mb-3 ${medal.color}`} />
        <Avatar className="h-16 w-16 mx-auto mb-3 ring-2 ring-background">
          <AvatarImage src={entry.avatar} />
          <AvatarFallback className="text-lg">
            {entry.username
              ? entry.username.slice(0, 2).toUpperCase()
              : entry.walletAddress.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold">
          {entry.username || truncateAddress(entry.walletAddress)}
        </h3>
        <p className="text-sm text-muted-foreground">Level {entry.level}</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
          <span className="font-bold text-xp">{formatXP(entry.xp)} XP</span>
          {entry.streak > 0 && (
            <span className="flex items-center gap-1 text-streak">
              <Flame className="h-4 w-4" />
              {entry.streak}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <tr
      className={`border-b hover:bg-muted/50 transition-colors ${
        isCurrentUser ? "bg-primary/5" : ""
      }`}
    >
      <td className="py-4 px-4">
        <span className="font-bold">#{entry.rank}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={entry.avatar} />
            <AvatarFallback>
              {entry.username
                ? entry.username.slice(0, 2).toUpperCase()
                : entry.walletAddress.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {entry.username || truncateAddress(entry.walletAddress)}
            </p>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <Badge variant="outline">Lvl {entry.level}</Badge>
      </td>
      <td className="py-4 px-4 text-right font-medium text-xp">
        {formatXP(entry.xp)}
      </td>
      <td className="py-4 px-4 text-right">
        {entry.streak > 0 ? (
          <span className="flex items-center justify-end gap-1 text-streak">
            <Flame className="h-4 w-4" />
            {entry.streak}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <RankChange change={entry.change} />
      </td>
    </tr>
  );
}

function RankChange({ change }: { change?: number }) {
  if (change === undefined || change === 0) {
    return (
      <span className="flex items-center justify-end text-muted-foreground">
        <Minus className="h-4 w-4" />
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="flex items-center justify-end gap-1 text-success">
        <ChevronUp className="h-4 w-4" />
        {change}
      </span>
    );
  }

  return (
    <span className="flex items-center justify-end gap-1 text-destructive">
      <ChevronDown className="h-4 w-4" />
      {Math.abs(change)}
    </span>
  );
}
