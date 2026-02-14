"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import { useI18n } from "@/lib/i18n/provider";

type Timeframe = "weekly" | "monthly" | "alltime";

const boardData: Record<Timeframe, Array<{ rank: number; username: string; xp: number; level: number; streak: number }>> = {
  weekly: [
    { rank: 1, username: "ana_sol", xp: 540, level: 2, streak: 6 },
    { rank: 2, username: "bruno.dev", xp: 490, level: 2, streak: 4 },
    { rank: 3, username: "carla_web3", xp: 460, level: 2, streak: 5 },
    { rank: 4, username: "davi_rust", xp: 410, level: 2, streak: 3 },
    { rank: 5, username: "elena.nft", xp: 385, level: 1, streak: 7 },
    { rank: 6, username: "you", xp: 350, level: 1, streak: 4 },
    { rank: 7, username: "felipe_tx", xp: 310, level: 1, streak: 2 },
    { rank: 8, username: "gabi.sol", xp: 275, level: 1, streak: 5 },
    { rank: 9, username: "henrique_defi", xp: 240, level: 1, streak: 1 },
    { rank: 10, username: "isabela.anchor", xp: 195, level: 1, streak: 3 },
  ],
  monthly: [
    { rank: 1, username: "ana_sol", xp: 2100, level: 4, streak: 17 },
    { rank: 2, username: "davi_rust", xp: 1860, level: 4, streak: 13 },
    { rank: 3, username: "bruno.dev", xp: 1650, level: 4, streak: 9 },
    { rank: 4, username: "carla_web3", xp: 1520, level: 3, streak: 11 },
    { rank: 5, username: "elena.nft", xp: 1380, level: 3, streak: 15 },
    { rank: 6, username: "gabi.sol", xp: 1210, level: 3, streak: 8 },
    { rank: 7, username: "you", xp: 1100, level: 3, streak: 10 },
    { rank: 8, username: "felipe_tx", xp: 980, level: 3, streak: 6 },
    { rank: 9, username: "henrique_defi", xp: 850, level: 2, streak: 5 },
    { rank: 10, username: "isabela.anchor", xp: 720, level: 2, streak: 7 },
  ],
  alltime: [
    { rank: 1, username: "ana_sol", xp: 8600, level: 9, streak: 31 },
    { rank: 2, username: "carla_web3", xp: 8120, level: 9, streak: 24 },
    { rank: 3, username: "davi_rust", xp: 7800, level: 8, streak: 27 },
    { rank: 4, username: "bruno.dev", xp: 6950, level: 8, streak: 19 },
    { rank: 5, username: "elena.nft", xp: 6400, level: 8, streak: 22 },
    { rank: 6, username: "felipe_tx", xp: 5200, level: 7, streak: 14 },
    { rank: 7, username: "gabi.sol", xp: 4800, level: 6, streak: 18 },
    { rank: 8, username: "you", xp: 4350, level: 6, streak: 16 },
    { rank: 9, username: "henrique_defi", xp: 3900, level: 6, streak: 11 },
    { rank: 10, username: "isabela.anchor", xp: 3100, level: 5, streak: 13 },
  ]
};

export default function LeaderboardPage(): JSX.Element {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const entries = useMemo(() => boardData[timeframe], [timeframe]);

  const timeframes: { key: Timeframe; label: string }[] = [
    { key: "weekly", label: t("leaderboard.weekly") },
    { key: "monthly", label: t("leaderboard.monthly") },
    { key: "alltime", label: t("leaderboard.alltime") },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("leaderboard.title")}</CardTitle>
          <CardDescription>{t("leaderboard.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.key}
                variant={timeframe === tf.key ? "default" : "outline"}
                onClick={() => setTimeframe(tf.key)}
                className={timeframe === tf.key ? "bg-solana-purple text-white hover:bg-solana-purple/90" : ""}
              >
                {tf.label}
              </Button>
            ))}
          </div>
          <LeaderboardTable
            entries={entries}
            currentUsername="you"
            labels={{
              rank: "#",
              user: t("common.user"),
              xp: t("common.xp"),
              level: t("common.level"),
              streak: t("common.streak")
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
