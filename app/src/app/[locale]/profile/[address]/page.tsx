"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Trophy,
  Zap,
  Flame,
  Award,
  CheckCircle,
  ExternalLink,
  Share2,
  Copy,
  Check,
  BookOpen,
  Calendar,
  TrendingUp,
  Shield,
  Link as LinkIcon,
  Twitter,
  Github,
  Globe
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// Mock profile data
const profile = {
  address: "7xKXexLFLHTpSQN4uN1aPph9Qq58rQtPdM3TjLcxK5vn",
  displayName: "SolDev_BR",
  bio: "Blockchain developer passionate about building on Solana. Learning every day at Superteam Academy.",
  avatar: null,
  joinedDate: "January 2026",
  location: "São Paulo, Brazil",
  links: {
    twitter: "@soldev_br",
    github: "soldevbr",
    website: "https://soldev.br"
  },
  stats: {
    xp: 4250,
    level: 10,
    rank: 42,
    totalUsers: 1250,
    coursesCompleted: 5,
    lessonsCompleted: 78,
    challengesWon: 3,
    streak: 14,
    longestStreak: 21
  },
  credentials: [
    {
      id: "cred-1",
      title: "Solana Fundamentals",
      description: "Mastered core Solana concepts and web3.js basics",
      issuedAt: "Feb 1, 2026",
      mintAddress: "3xK...h9Q",
      txSignature: "4yL...mR7",
      track: "Core",
      verified: true,
      image: "https://arweave.net/solana-fundamentals-badge"
    },
    {
      id: "cred-2",
      title: "Anchor Developer",
      description: "Built and deployed programs using Anchor framework",
      issuedAt: "Feb 8, 2026",
      mintAddress: "5tM...k2P",
      txSignature: "6uN...nS8",
      track: "Development",
      verified: true,
      image: "https://arweave.net/anchor-developer-badge"
    },
    {
      id: "cred-3",
      title: "Token Expert",
      description: "Created and managed SPL tokens with Token-2022",
      issuedAt: "Feb 12, 2026",
      mintAddress: "7vO...l3Q",
      txSignature: "8wP...oT9",
      track: "Tokens",
      verified: true,
      image: "https://arweave.net/token-expert-badge"
    }
  ],
  achievements: [
    { id: "first-lesson", name: "First Steps", description: "Complete your first lesson", earned: true, rarity: "common" },
    { id: "week-streak", name: "Week Warrior", description: "7-day learning streak", earned: true, rarity: "uncommon" },
    { id: "two-week-streak", name: "Consistent Learner", description: "14-day learning streak", earned: true, rarity: "rare" },
    { id: "challenge-winner", name: "Challenge Champion", description: "Win a weekly challenge", earned: true, rarity: "rare" },
    { id: "perfect-quiz", name: "Perfect Score", description: "Score 100% on any quiz", earned: true, rarity: "uncommon" },
    { id: "top-100", name: "Rising Star", description: "Reach top 100 on leaderboard", earned: true, rarity: "rare" },
    { id: "five-courses", name: "Knowledge Seeker", description: "Complete 5 courses", earned: true, rarity: "epic" },
    { id: "top-50", name: "Elite Coder", description: "Reach top 50 on leaderboard", earned: true, rarity: "epic" },
    { id: "month-streak", name: "Monthly Dedication", description: "30-day learning streak", earned: false, rarity: "legendary" },
    { id: "top-10", name: "Master Developer", description: "Reach top 10 on leaderboard", earned: false, rarity: "legendary" }
  ],
  recentActivity: [
    { type: "credential", title: "Token Expert", description: "Earned credential", time: "2 days ago" },
    { type: "challenge", title: "Token Swap Challenge", description: "Won weekly challenge", time: "3 days ago" },
    { type: "lesson", title: "Advanced PDAs", course: "Anchor Framework", time: "4 days ago" },
    { type: "achievement", title: "Five Courses", description: "Unlocked achievement", time: "5 days ago" }
  ]
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "bg-slate-500";
    case "uncommon":
      return "bg-green-500";
    case "rare":
      return "bg-blue-500";
    case "epic":
      return "bg-purple-500";
    case "legendary":
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    default:
      return "bg-muted";
  }
};

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProfile = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profile.displayName} - Superteam Academy`,
        url: window.location.href
      });
    }
  };

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
            <Link href="/challenges" className="text-muted-foreground hover:text-foreground transition-colors">
              Challenges
            </Link>
            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
          <div className="ml-auto">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="flex-1">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Level {profile.stats.level}
                  </Badge>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {profile.address.slice(0, 8)}...{profile.address.slice(-8)}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`https://solscan.io/account/${profile.address}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <p className="text-muted-foreground mb-4">{profile.bio}</p>

                {/* Social Links */}
                <div className="flex items-center gap-3">
                  {profile.links.twitter && (
                    <a href={`https://twitter.com/${profile.links.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {profile.links.github && (
                    <a href={`https://github.com/${profile.links.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {profile.links.website && (
                    <a href={profile.links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={shareProfile} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.stats.xp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">#{profile.stats.rank}</p>
              <p className="text-xs text-muted-foreground">Global Rank</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.stats.streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.stats.challengesWon}</p>
              <p className="text-xs text-muted-foreground">Challenges Won</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.stats.coursesCompleted}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.stats.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* On-Chain Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  On-Chain Credentials
                </CardTitle>
                <CardDescription>
                  Verifiable certificates stored on Solana
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.credentials.map(credential => (
                  <div
                    key={credential.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent"
                  >
                    {/* Credential Badge Visual */}
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0">
                      <Award className="h-8 w-8 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{credential.title}</h4>
                        {credential.verified && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="secondary">{credential.track}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{credential.description}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Issued: {credential.issuedAt}</span>
                        <a
                          href={`https://solscan.io/token/${credential.mintAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <LinkIcon className="h-3 w-3" />
                          View on Solscan
                        </a>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/verify/${credential.mintAddress}`}>
                        Verify
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === "credential" ? "bg-primary/10" :
                        activity.type === "challenge" ? "bg-yellow-500/10" :
                        activity.type === "achievement" ? "bg-purple-500/10" :
                        "bg-muted"
                      }`}>
                        {activity.type === "credential" && <Award className="h-5 w-5 text-primary" />}
                        {activity.type === "challenge" && <Trophy className="h-5 w-5 text-yellow-500" />}
                        {activity.type === "lesson" && <BookOpen className="h-5 w-5 text-muted-foreground" />}
                        {activity.type === "achievement" && <CheckCircle className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description || activity.course}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Achievements */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {profile.achievements.filter(a => a.earned).length} of {profile.achievements.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        achievement.earned ? "" : "opacity-40"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getRarityColor(achievement.rarity)}`}>
                        {achievement.earned ? (
                          <Trophy className="h-5 w-5 text-white" />
                        ) : (
                          <Trophy className="h-5 w-5 text-white/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Member Info */}
            <Card>
              <CardHeader>
                <CardTitle>Member Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{profile.joinedDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lessons Completed</span>
                  <span>{profile.stats.lessonsCompleted}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
