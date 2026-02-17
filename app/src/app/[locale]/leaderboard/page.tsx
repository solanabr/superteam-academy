"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Flame, Crown, Medal } from "lucide-react";

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    username: "solana_dev",
    displayName: "Maria Silva",
    totalXP: 12500,
    level: 11,
    currentStreak: 45,
  },
  {
    rank: 2,
    username: "rust_master",
    displayName: "Pedro Santos",
    totalXP: 10200,
    level: 10,
    currentStreak: 30,
  },
  {
    rank: 3,
    username: "web3_builder",
    displayName: "Ana Costa",
    totalXP: 8900,
    level: 9,
    currentStreak: 22,
  },
  {
    rank: 4,
    username: "anchor_pro",
    displayName: "Lucas Oliveira",
    totalXP: 7600,
    level: 8,
    currentStreak: 15,
  },
  {
    rank: 5,
    username: "defi_wizard",
    displayName: "Julia Ferreira",
    totalXP: 6300,
    level: 7,
    currentStreak: 12,
  },
  {
    rank: 6,
    username: "nft_creator",
    displayName: "Rafael Lima",
    totalXP: 5100,
    level: 7,
    currentStreak: 8,
  },
  {
    rank: 7,
    username: "token_king",
    displayName: "Beatriz Souza",
    totalXP: 4200,
    level: 6,
    currentStreak: 5,
  },
  {
    rank: 8,
    username: "chain_dev",
    displayName: "Gabriel Almeida",
    totalXP: 3500,
    level: 5,
    currentStreak: 3,
  },
  {
    rank: 9,
    username: "crypto_coder",
    displayName: "Isabela Rodrigues",
    totalXP: 2800,
    level: 5,
    currentStreak: 7,
  },
  {
    rank: 10,
    username: "block_builder",
    displayName: "Thiago Martins",
    totalXP: 2100,
    level: 4,
    currentStreak: 2,
  },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  );
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const [timeframe, setTimeframe] = useState("alltime");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Trophy className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-6">
        <TabsList>
          <TabsTrigger value="weekly">{t("weekly")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
          <TabsTrigger value="alltime">{t("allTime")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Your Rank */}
      <Card className="mb-6 border-primary/30">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="font-bold text-primary">#42</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("yourRank")}</p>
            <p className="text-sm text-muted-foreground">3,420 {tc("xp")}</p>
          </div>
          <Badge variant="secondary">{tc("level")} 5</Badge>
        </CardContent>
      </Card>

      {/* Top 3 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {MOCK_LEADERBOARD.slice(0, 3).map((entry) => (
          <Card
            key={entry.rank}
            className={
              entry.rank === 1 ? "border-yellow-500/50 bg-yellow-500/5" : ""
            }
          >
            <CardContent className="flex flex-col items-center p-6 text-center">
              {getRankIcon(entry.rank)}
              <div className="mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {entry.displayName.charAt(0)}
              </div>
              <p className="mt-2 font-semibold">{entry.displayName}</p>
              <p className="text-xs text-muted-foreground">@{entry.username}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  {entry.totalXP.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {entry.currentStreak}d
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remaining entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("topLearners")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_LEADERBOARD.slice(3).map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {entry.displayName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  @{entry.username}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3.5 w-3.5" />
                  {entry.totalXP.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="h-3.5 w-3.5" />
                  {entry.currentStreak}d
                </span>
                <Badge variant="secondary" className="text-xs">
                  {tc("level")} {entry.level}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
