"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Flame,
  Star,
  Medal,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseCard } from "@/components/courses/course-card";
import {
  gamificationService,
  learningProgressService,
  courseService,
} from "@/services";
import {
  formatXP,
  getLevel,
  getXPProgress,
  truncateAddress,
} from "@/lib/utils";
import type { Achievement, Course } from "@/types";
import type { Progress as ProgressType } from "@/types";

export function Dashboard() {
  const t = useTranslations("dashboard");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  // Redirect to connect wallet if not connected
  if (!connected) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect your wallet to access your dashboard, track progress, and earn
          credentials.
        </p>
        <Button size="lg" onClick={() => setVisible(true)}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return <DashboardContent walletAddress={publicKey?.toBase58() || ""} />;
}

function DashboardContent({ walletAddress }: { walletAddress: string }) {
  const t = useTranslations("dashboard");

  // Fetch gamification data
  const { data: xpData } = useQuery({
    queryKey: ["gamification", "xp", walletAddress],
    queryFn: () => gamificationService.getXPBalance(),
  });

  const { data: streakData } = useQuery({
    queryKey: ["gamification", "streak", walletAddress],
    queryFn: () => gamificationService.getStreak(),
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["gamification", "achievements", walletAddress],
    queryFn: () => gamificationService.getAchievements(),
  });

  const { data: rankData } = useQuery({
    queryKey: ["gamification", "rank", walletAddress],
    queryFn: () => gamificationService.getRank(),
  });

  // Fetch course progress
  const { data: progressData } = useQuery({
    queryKey: ["progress", "all", walletAddress],
    queryFn: () => learningProgressService.getAllProgress("user-wallet"),
  });

  // Fetch courses for continue learning
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseService.getCourses({}),
  });

  const xp = xpData?.data || 0;
  const level = getLevel(xp);
  const xpProgress = getXPProgress(xp);
  const streak = streakData?.data || { currentStreak: 0, longestStreak: 0, freezesAvailable: 0 };
  const achievements = achievementsData?.data || [];
  const rank = rankData?.data || 0;
  const progressList: ProgressType[] = progressData || [];
  const courses = coursesData?.data || [];

  // Find in-progress courses
  const inProgressCourses = courses.filter((course) => {
    const progress = progressList.find((p: ProgressType) => p.courseId === course.id);
    return progress && progress.completedLessons.length > 0 && progress.completedLessons.length < course.lessonCount;
  });

  // Recent achievements (last 5)
  const recentAchievements = achievements
    .filter((a) => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 5);

  // Recommended courses (not started)
  const recommendedCourses = courses
    .filter((course) => {
      const progress = progressList.find((p: ProgressType) => p.courseId === course.id);
      return !progress || progress.completedLessons.length === 0;
    })
    .slice(0, 3);

  return (
    <div className="container px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("welcome", { name: truncateAddress(walletAddress) })}
        </h1>
        <p className="text-muted-foreground mt-1">
          Keep up the great work on your Solana journey!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title={t("stats.xp")}
          value={formatXP(xp)}
          icon={Zap}
          iconColor="text-xp"
          description={`Level ${level} · ${xpProgress}% to next`}
        />
        <StatsCard
          title={t("stats.streak")}
          value={`${streak.currentStreak}`}
          icon={Flame}
          iconColor="text-streak"
          description={`Longest: ${streak.longestStreak} days`}
        />
        <StatsCard
          title={t("stats.rank")}
          value={`#${rank || "—"}`}
          icon={Medal}
          iconColor="text-primary"
          description="Global leaderboard"
        />
        <StatsCard
          title={t("stats.achievements")}
          value={`${achievements.filter((a) => a.unlockedAt).length}`}
          icon={Award}
          iconColor="text-yellow-500"
          description={`of ${achievements.length} unlocked`}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          {inProgressCourses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {t("continuelearning")}
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgressCourses.slice(0, 2).map((course) => {
                  const progress = progressList.find((p: ProgressType) => p.courseId === course.id);
                  const percent = progress
                    ? Math.round((progress.completedLessons.length / course.lessonCount) * 100)
                    : 0;
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={percent}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommended Courses */}
          {recommendedCourses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {t("recommended.title")}
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">
                    Browse All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold mb-2">
                  {level}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatXP(xp)} XP total
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Level {level + 1}</span>
                  <span>{xpProgress.percentage}%</span>
                </div>
                <Progress value={xpProgress.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-streak" />
                {t("streak.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-streak">
                  {streak.currentStreak}
                </div>
                <p className="text-sm text-muted-foreground">day streak</p>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("streak.longest", { days: streak.longestStreak })}</span>
                <span>{t("streak.freezes", { count: streak.freezesAvailable })}</span>
              </div>
              {/* Week view */}
              <div className="flex justify-center gap-1 mt-4">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      i < streak.currentStreak % 7
                        ? "bg-streak text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {t("achievements.title")}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile?tab=achievements">
                    {t("achievements.viewAll")}
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{achievement.xpReward} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete lessons to unlock achievements!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
}: {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
