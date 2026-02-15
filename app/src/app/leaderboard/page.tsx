"use client";

import { MOCK_LEADERBOARD, MOCK_LEARNER } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Flame,
  TrendingUp,
  Medal,
  Users,
} from "lucide-react";
import { formatXP } from "@/lib/utils";

export default function LeaderboardPage() {
  const topThree = MOCK_LEADERBOARD.slice(0, 3);

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Season 1 rankings. XP balances are read directly from on-chain
          Token-2022 accounts.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid md:grid-cols-3 gap-4">
        {topThree.map((entry, idx) => {
          const colors = [
            "border-yellow-400/30 bg-yellow-400/5",
            "border-gray-300/30 bg-gray-300/5",
            "border-amber-600/30 bg-amber-600/5",
          ];
          const iconColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
          const icons = [Trophy, Medal, Medal];
          const Icon = icons[idx];
          return (
            <Card
              key={entry.address}
              className={`${colors[idx]} ${
                idx === 0 ? "md:order-1 md:-mt-4" : idx === 1 ? "md:order-0" : "md:order-2"
              }`}
            >
              <CardContent className="pt-6 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${iconColors[idx]}`} />
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold">{entry.displayName}</h3>
                <p className="text-2xl font-bold gradient-text mt-1">
                  {formatXP(entry.xp)} XP
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    {entry.streak}d
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-solana-green" />
                    Lv.{entry.level}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {entry.coursesCompleted}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <Tabs defaultValue="xp">
        <TabsList>
          <TabsTrigger value="xp">XP Rankings</TabsTrigger>
          <TabsTrigger value="streaks">Top Streaks</TabsTrigger>
          <TabsTrigger value="courses">Most Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="xp" className="mt-4">
          <LeaderboardTable
            entries={MOCK_LEADERBOARD}
            currentUserAddress={MOCK_LEARNER.address}
          />
        </TabsContent>

        <TabsContent value="streaks" className="mt-4">
          <LeaderboardTable
            entries={[...MOCK_LEADERBOARD].sort((a, b) => b.streak - a.streak).map((e, i) => ({ ...e, rank: i + 1 }))}
            currentUserAddress={MOCK_LEARNER.address}
          />
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <LeaderboardTable
            entries={[...MOCK_LEADERBOARD].sort((a, b) => b.coursesCompleted - a.coursesCompleted).map((e, i) => ({ ...e, rank: i + 1 }))}
            currentUserAddress={MOCK_LEARNER.address}
          />
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="border-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">How Rankings Work</h3>
              <p className="text-sm text-muted-foreground">
                Rankings are derived directly from soulbound XP token balances
                on Solana via the Helius DAS API. XP is non-transferable and
                non-burnable -- your rank is a true reflection of your learning
                progress. Each season starts a new mint, so everyone begins
                fresh while keeping historical tokens.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
