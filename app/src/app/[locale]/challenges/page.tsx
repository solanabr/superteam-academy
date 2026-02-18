"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Trophy,
  Clock,
  Users,
  Zap,
  Star,
  Target,
  CheckCircle,
  Lock,
  Play,
  Filter,
  ChevronRight,
  Flame,
  Award
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// Mock challenges data
const dailyChallenges = [
  {
    id: "daily-1",
    title: "Token Balance Checker",
    description: "Write a function that fetches and returns the SOL balance for a given public key.",
    difficulty: "beginner",
    xpReward: 100,
    timeLimit: "15 min",
    participants: 234,
    tags: ["web3.js", "rpc"],
    completed: true
  },
  {
    id: "daily-2",
    title: "NFT Metadata Parser",
    description: "Parse and display metadata from a Metaplex NFT given its mint address.",
    difficulty: "intermediate",
    xpReward: 150,
    timeLimit: "25 min",
    participants: 89,
    tags: ["metaplex", "metadata"],
    completed: false
  },
  {
    id: "daily-3",
    title: "Transaction Builder",
    description: "Create a signed transaction that transfers SOL between two accounts.",
    difficulty: "advanced",
    xpReward: 250,
    timeLimit: "30 min",
    participants: 45,
    tags: ["transactions", "signing"],
    completed: false
  }
];

const weeklyChallenge = {
  id: "weekly-1",
  title: "Build a Token Swap Interface",
  description: "Create a functional token swap interface using Jupiter aggregator. Must support multiple tokens and display rates.",
  difficulty: "advanced",
  xpReward: 1000,
  bonusXp: 500,
  timeRemaining: "3 days 14 hours",
  participants: 156,
  submissions: 23,
  prizePool: "500 USDC",
  tags: ["jupiter", "swap", "defi"],
  requirements: [
    "Connect wallet functionality",
    "Token selection dropdown",
    "Real-time price quotes",
    "Transaction execution",
    "Error handling"
  ]
};

const pastChallenges = [
  {
    id: "past-1",
    title: "Anchor Counter Program",
    description: "Build a counter program using Anchor framework with increment/decrement functions.",
    difficulty: "intermediate",
    xpReward: 500,
    winner: "0x7xK...h9Q",
    participants: 312,
    completedAt: "Feb 10, 2026"
  },
  {
    id: "past-2",
    title: "SPL Token Creator",
    description: "Create an SPL token with custom metadata and initial supply.",
    difficulty: "beginner",
    xpReward: 300,
    winner: "0xF2s...mR7",
    participants: 456,
    completedAt: "Feb 3, 2026"
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "intermediate":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "advanced":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted";
  }
};

export default function ChallengesPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
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
            <Link href="/challenges" className="font-medium text-foreground">
              Challenges
            </Link>
            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              2,750 XP
            </Badge>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Code Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Test your skills, compete with others, and earn XP
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Random Challenge
            </Button>
          </div>
        </div>

        {/* Weekly Challenge Banner */}
        <Card className="mb-8 overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground">
                    <Trophy className="h-3 w-3 mr-1" />
                    Weekly Challenge
                  </Badge>
                  <Badge variant="outline" className={getDifficultyColor(weeklyChallenge.difficulty)}>
                    {weeklyChallenge.difficulty}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2">{weeklyChallenge.title}</h2>
                <p className="text-muted-foreground mb-4">{weeklyChallenge.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {weeklyChallenge.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{weeklyChallenge.timeRemaining}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{weeklyChallenge.participants} competing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{weeklyChallenge.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{weeklyChallenge.prizePool}</span>
                  </div>
                </div>

                <Button size="lg" className="gap-2">
                  Start Challenge
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="lg:w-72 shrink-0">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {weeklyChallenge.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Daily/All/Past */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList>
            <TabsTrigger value="daily" className="gap-2">
              <Flame className="h-4 w-4" />
              Daily Challenges
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Target className="h-4 w-4" />
              All Challenges
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Trophy className="h-4 w-4" />
              Past Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Today&apos;s Challenges</span>
              <Badge variant="outline">Resets in 8h 23m</Badge>
            </div>

            <div className="grid gap-4">
              {dailyChallenges.map(challenge => (
                <Card key={challenge.id} className={challenge.completed ? "opacity-75" : ""}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {challenge.completed && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {challenge.timeLimit}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold mb-1">{challenge.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{challenge.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {challenge.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {challenge.participants}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            +{challenge.xpReward} XP
                          </span>
                        </div>
                        <Button disabled={challenge.completed} className="gap-2">
                          {challenge.completed ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Done
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">156 Challenges Available</span>
              <div className="flex gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  All
                </Button>
                <Button variant={filter === "beginner" ? "default" : "outline"} size="sm" onClick={() => setFilter("beginner")}>
                  Beginner
                </Button>
                <Button variant={filter === "intermediate" ? "default" : "outline"} size="sm" onClick={() => setFilter("intermediate")}>
                  Intermediate
                </Button>
                <Button variant={filter === "advanced" ? "default" : "outline"} size="sm" onClick={() => setFilter("advanced")}>
                  Advanced
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[...dailyChallenges, ...dailyChallenges.map(c => ({ ...c, id: c.id + "-2", completed: false }))].map(challenge => (
                <Card key={challenge.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {challenge.xpReward}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {challenge.timeLimit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {challenge.participants}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <div className="font-medium mb-4">Past Challenge Winners</div>

            <div className="grid gap-4">
              {pastChallenges.map(challenge => (
                <Card key={challenge.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Winner: <span className="font-mono">{challenge.winner}</span>
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {challenge.participants} participated
                          </span>
                          <span className="text-muted-foreground">{challenge.completedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-lg font-medium shrink-0">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {challenge.xpReward} XP
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
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
