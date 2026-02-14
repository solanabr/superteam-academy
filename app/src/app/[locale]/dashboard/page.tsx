"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Zap,
  Flame,
  Trophy,
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Star,
  CheckCircle,
  Lock
} from "lucide-react";
import Link from "next/link";
import { useProgress } from "@/contexts/ProgressContext";
import { useWallet } from "@solana/wallet-adapter-react";

// Mock user data
const userData = {
  address: "7xKX...h9Qp",
  displayName: "SolDev_BR",
  xp: 2750,
  level: 8,
  nextLevelXp: 3000,
  rank: 42,
  totalRanked: 1250,
  streak: 7,
  longestStreak: 14,
  coursesCompleted: 3,
  coursesInProgress: 2,
  lessonsCompleted: 45,
  totalLessons: 120,
  timeSpent: "24h 30m",
  joinedDate: "Jan 15, 2026",
  achievements: [
    { id: "first-lesson", name: "First Steps", description: "Complete your first lesson", icon: "rocket", earned: true },
    { id: "week-streak", name: "Week Warrior", description: "7-day learning streak", icon: "flame", earned: true },
    { id: "anchor-master", name: "Anchor Master", description: "Complete Anchor Framework course", icon: "anchor", earned: true },
    { id: "perfect-quiz", name: "Perfect Score", description: "Score 100% on any quiz", icon: "star", earned: true },
    { id: "top-100", name: "Rising Star", description: "Reach top 100 on leaderboard", icon: "trending", earned: true },
    { id: "month-streak", name: "Monthly Dedication", description: "30-day learning streak", icon: "calendar", earned: false },
    { id: "all-courses", name: "Scholar", description: "Complete all courses", icon: "graduation", earned: false },
    { id: "top-10", name: "Elite Coder", description: "Reach top 10 on leaderboard", icon: "crown", earned: false }
  ],
  recentActivity: [
    { type: "lesson", title: "PDAs and Account Design", course: "Anchor Framework", xp: 75, time: "2h ago" },
    { type: "quiz", title: "Quiz: Anchor Basics", course: "Anchor Framework", xp: 50, time: "3h ago" },
    { type: "lesson", title: "Account Validation", course: "Anchor Framework", xp: 60, time: "Yesterday" },
    { type: "achievement", title: "Week Warrior", description: "7-day streak achieved!", xp: 100, time: "Yesterday" }
  ],
  coursesProgress: [
    { id: "solana-101", title: "Solana 101", progress: 100, completed: true, credential: true },
    { id: "wallet-integration", title: "Wallet Integration", progress: 100, completed: true, credential: true },
    { id: "anchor-basics", title: "Anchor Framework", progress: 65, completed: false, credential: false },
    { id: "token-2022", title: "Token-2022 Extensions", progress: 20, completed: false, credential: false },
    { id: "defi-fundamentals", title: "DeFi on Solana", progress: 0, completed: false, credential: false }
  ]
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { progress, isLoading } = useProgress();
  const { publicKey, connected } = useWallet();

  // Merge real progress with mock data for display
  const displayData = {
    ...userData,
    xp: progress?.totalXP ?? userData.xp,
    streak: progress?.currentStreak ?? userData.streak,
    longestStreak: progress?.longestStreak ?? userData.longestStreak,
    lessonsCompleted: progress?.completedLessons?.length ?? userData.lessonsCompleted,
    address: publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : userData.address
  };

  const xpProgress = (displayData.xp / userData.nextLevelXp) * 100;

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
            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="font-medium text-foreground">
              Dashboard
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{displayData.streak} day streak</span>
            </div>
            <Button variant="outline" size="sm">
              {displayData.address}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-3xl font-bold text-white">
            {userData.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{userData.displayName}</h1>
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3" />
                Level {userData.level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Rank #{userData.rank} of {userData.totalRanked.toLocaleString()} learners
            </p>
            {/* XP Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {displayData.xp.toLocaleString()} XP
                </span>
                <span className="text-muted-foreground">{userData.nextLevelXp.toLocaleString()} XP to Level {userData.level + 1}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden w-full max-w-md">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings">Settings</Link>
            </Button>
            <Button asChild>
              <Link href="/courses">Continue Learning</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Current Streak"
            value={`${userData.streak} days`}
            icon={Flame}
            description={`Best: ${userData.longestStreak} days`}
          />
          <StatCard
            title="Courses Completed"
            value={userData.coursesCompleted}
            icon={Trophy}
            trend="+1 this month"
          />
          <StatCard
            title="Lessons Completed"
            value={userData.lessonsCompleted}
            icon={BookOpen}
            description={`${Math.round((userData.lessonsCompleted / userData.totalLessons) * 100)}% overall progress`}
          />
          <StatCard
            title="Time Learning"
            value={userData.timeSpent}
            icon={Clock}
            description={`Since ${userData.joinedDate}`}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.coursesProgress
                  .filter(c => c.progress > 0 && c.progress < 100)
                  .map(course => (
                    <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium group-hover:text-primary transition-colors">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{course.progress}%</span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>
                          Continue
                          <ChevronRight className="h-4 w-4 ml-1" />
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
                  {userData.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === "achievement"
                          ? "bg-yellow-500/10"
                          : "bg-primary/10"
                      }`}>
                        {activity.type === "lesson" && <BookOpen className="h-5 w-5 text-primary" />}
                        {activity.type === "quiz" && <Target className="h-5 w-5 text-primary" />}
                        {activity.type === "achievement" && <Award className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === "achievement" ? activity.description : activity.course}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          +{activity.xp}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {userData.achievements.filter(a => a.earned).length} of {userData.achievements.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {userData.achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`relative group ${!achievement.earned && "opacity-40"}`}
                      title={achievement.name}
                    >
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        achievement.earned
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                          : "bg-muted"
                      }`}>
                        {achievement.earned ? (
                          <Trophy className="h-5 w-5 text-white" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="w-full mt-4 text-sm" asChild>
                  <Link href="/achievements">View All Achievements</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Credentials
                </CardTitle>
                <CardDescription>Verifiable on-chain certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userData.coursesProgress
                    .filter(c => c.credential)
                    .map(course => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                      >
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{course.title}</p>
                          <p className="text-xs text-green-600">Credential Earned</p>
                        </div>
                      </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/profile/${userData.address}`}>
                    View Public Profile
                  </Link>
                </Button>
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
