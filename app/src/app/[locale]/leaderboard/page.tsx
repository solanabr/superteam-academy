"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Zap,
  Flame,
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// Mock leaderboard data
const leaderboardData = [
  { rank: 1, address: "7xKX...h9Qp", name: "CryptoDevBR", xp: 15420, streak: 45, level: 24, change: 0, avatar: "CD" },
  { rank: 2, address: "3mNp...k2Rt", name: "SolanaBuilder", xp: 14890, streak: 32, level: 23, change: 1, avatar: "SB" },
  { rank: 3, address: "9pLw...x5Hn", name: "RustMaster", xp: 14250, streak: 28, level: 22, change: -1, avatar: "RM" },
  { rank: 4, address: "2kJq...m8Fs", name: "AnchorPro", xp: 13100, streak: 21, level: 21, change: 2, avatar: "AP" },
  { rank: 5, address: "8tYw...p3Dz", name: "TokenWizard", xp: 12750, streak: 19, level: 20, change: 0, avatar: "TW" },
  { rank: 6, address: "5vXr...n7Bg", name: "DeFiDev", xp: 11980, streak: 15, level: 19, change: -2, avatar: "DD" },
  { rank: 7, address: "4qMn...s9Cw", name: "NFTNinja", xp: 11200, streak: 18, level: 18, change: 3, avatar: "NN" },
  { rank: 8, address: "6hPt...y1Kx", name: "SmartContract", xp: 10850, streak: 12, level: 17, change: 1, avatar: "SC" },
  { rank: 9, address: "1bFz...r4Jv", name: "ChainCoder", xp: 10500, streak: 14, level: 17, change: -1, avatar: "CC" },
  { rank: 10, address: "7wQs...u6Ln", name: "Web3Builder", xp: 10200, streak: 11, level: 16, change: 0, avatar: "WB" },
  { rank: 41, address: "9fGh...t2Mp", name: "BlockDev", xp: 2850, streak: 8, level: 8, change: 5, avatar: "BD" },
  { rank: 42, address: "YOUR...ADDR", name: "SolDev_BR", xp: 2750, streak: 7, level: 8, change: 3, avatar: "SD", isCurrentUser: true },
  { rank: 43, address: "3jKw...z9Rq", name: "CryptoLearner", xp: 2700, streak: 6, level: 8, change: -2, avatar: "CL" }
];

const timeframes = [
  { value: "all", label: "All Time" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" }
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
        <Crown className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
        <Medal className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <Medal className="h-5 w-5 text-white" />
      </div>
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-600 text-xs">
        <TrendingUp className="h-3 w-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-600 text-xs">
        <TrendingDown className="h-3 w-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="h-3 w-3" />
    </span>
  );
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const topThree = leaderboardData.filter(u => u.rank <= 3);
  const restOfLeaderboard = leaderboardData.filter(u => u.rank > 3);
  const currentUser = leaderboardData.find(u => u.isCurrentUser);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            <span>Superteam Academy</span>
          </Link>
          <nav className="flex items-center gap-6 ml-8 text-sm">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/leaderboard" className="font-medium text-foreground">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
          <div className="ml-auto">
            <Button>Connect Wallet</Button>
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {leaderboardData.length.toLocaleString()} learners competing
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={timeframe} onValueChange={setTimeframe}>
              <TabsList>
                {timeframes.map(tf => (
                  <TabsTrigger key={tf.value} value={tf.value}>
                    {tf.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="md:order-1 border-gray-500/30 bg-gray-500/5">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-2xl font-bold text-white mx-auto">
                  {topThree[1]?.avatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gray-500 hover:bg-gray-600">2nd</Badge>
                </div>
              </div>
              <h3 className="font-bold text-lg">{topThree[1]?.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{topThree[1]?.address}</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {topThree[1]?.xp.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {topThree[1]?.streak}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="md:order-0 border-yellow-500/30 bg-yellow-500/5 md:-mt-4">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-white mx-auto ring-4 ring-yellow-500/30">
                  {topThree[0]?.avatar}
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>
                </div>
              </div>
              <h3 className="font-bold text-xl">{topThree[0]?.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{topThree[0]?.address}</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {topThree[0]?.xp.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {topThree[0]?.streak}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="md:order-2 border-orange-500/30 bg-orange-500/5">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold text-white mx-auto">
                  {topThree[2]?.avatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 hover:bg-orange-600">3rd</Badge>
                </div>
              </div>
              <h3 className="font-bold text-lg">{topThree[2]?.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{topThree[2]?.address}</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {topThree[2]?.xp.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {topThree[2]?.streak}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Position */}
        {currentUser && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <RankBadge rank={currentUser.rank} />
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-lg font-bold text-white">
                  {currentUser.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{currentUser.name}</span>
                    <Badge variant="secondary">You</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentUser.address}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {currentUser.xp.toLocaleString()}
                    </div>
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {currentUser.streak}
                    </div>
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold">Lvl {currentUser.level}</span>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <ChangeIndicator change={currentUser.change} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rankings</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restOfLeaderboard.map(user => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    user.isCurrentUser
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <RankBadge rank={user.rank} />
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center font-bold text-sm">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{user.name}</span>
                      {user.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{user.address}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 w-24">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{user.xp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 w-16">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{user.streak}</span>
                    </div>
                    <div className="w-12 text-center">
                      <Badge variant="outline">Lvl {user.level}</Badge>
                    </div>
                    <div className="w-12">
                      <ChangeIndicator change={user.change} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing 1-13 of {leaderboardData.length.toLocaleString()} learners
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Superteam Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by Superteam Brazil
          </p>
        </div>
      </footer>
    </div>
  );
}
