'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers';
import { useTranslation } from '@/hooks';
import {
  BookOpen,
  Trophy,
  Flame,
  Star,
  Award,
  Zap,
  Clock,
  ChevronRight,
  PlayCircle,
  TrendingUp,
  Calendar,
  Target,
  GraduationCap,
  ArrowRight,
  Medal,
  Sparkles,
} from 'lucide-react';
import { ACHIEVEMENTS } from '@/types/gamification';
import { getLucideIcon } from '@/lib/icon-utils';

interface DashboardData {
  userProgress: {
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    completedCourses: number;
    totalCourses: number;
    completionRate: number;
    userRank: number;
    totalUsers: number;
  };
  streakData: {
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{ date: string; hasActivity: boolean }>;
    lastActivityDate: string | null;
  };
  currentCourses: Array<{
    id: string;
    slug: string;
    title: string;
    progress: number;
    lessonsCompleted: number;
    totalLessons: number;
    difficulty: string;
    thumbnail: string;
    nextLesson: { slug: string; title: string; moduleTitle: string } | null;
  }>;
  recommendedCourses: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    duration: number;
    lessonsCount: number;
    xpReward: number;
    thumbnail: string;
  }>;
  achievements: Array<{
    achievementId: string;
    unlockedAt: string;
    nftMintAddress?: string;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
    xpEarned?: number;
  }>;
}

// Calculate XP needed for next level
function getXPForLevel(level: number): number {
  return level * level * 100;
}

function getXPProgress(totalXP: number, level: number): number {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  return Math.min(Math.round((xpIntoLevel / xpNeeded) * 100), 100);
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>Please try again later</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const {
    userProgress,
    streakData,
    currentCourses,
    recommendedCourses,
    achievements,
    recentActivity,
  } = data;
  const xpProgress = getXPProgress(userProgress.totalXP, userProgress.level);
  const xpToNextLevel = getXPForLevel(userProgress.level + 1) - userProgress.totalXP;

  // Get achievement details from ACHIEVEMENTS constant
  const recentAchievements = achievements.slice(0, 6).map((ua) => {
    const achievementDef = ACHIEVEMENTS.find((a) => a.id === ua.achievementId);
    return {
      ...ua,
      name: achievementDef?.name || 'Achievement',
      description: achievementDef?.description || '',
      icon: achievementDef?.icon || 'trophy',
      rarity: achievementDef?.rarity || 'common',
    };
  });

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your learning progress and what&apos;s next for you.
        </p>
      </div>

      {/* Stats Overview Row */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* XP & Level Card */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-900/30 dark:to-blue-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total XP</p>
                <p className="text-foreground text-3xl font-bold">
                  {userProgress.totalXP.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Level {userProgress.level}</span>
                <span className="text-purple-500 dark:text-purple-400">{xpToNextLevel} XP to next</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Rank Card */}
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-900/30 dark:to-orange-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Global Rank</p>
                <p className="text-foreground text-3xl font-bold">#{userProgress.userRank}</p>
              </div>
              <div className="bg-yellow-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">
              Out of {userProgress.totalUsers.toLocaleString()} learners
            </p>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-900/30 dark:to-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Current Streak</p>
                <p className="text-foreground text-3xl font-bold">
                  {streakData.currentStreak} days
                </p>
              </div>
              <div className="bg-orange-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                <Flame className="h-6 w-6 animate-pulse text-orange-400" />
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">Best: {streakData.longestStreak} days</p>
          </CardContent>
        </Card>

        {/* Courses Completed Card */}
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-900/30 dark:to-emerald-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Courses</p>
                <p className="text-foreground text-3xl font-bold">
                  {userProgress.completedCourses}/{userProgress.totalCourses}
                </p>
              </div>
              <div className="bg-green-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                <GraduationCap className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">
              {userProgress.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Current Courses */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Courses Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                    Continue Learning
                  </CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentCourses.length === 0 ? (
                <div className="py-8 text-center">
                  <GraduationCap className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">No courses in progress</p>
                  <Button asChild>
                    <Link href="/discover">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentCourses.map((course) => (
                    <div
                      key={course.id}
                      className="group bg-muted/30 hover:bg-muted/50 rounded-lg border border-border p-4 transition-colors hover:border-blue-500/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate font-semibold">{course.title}</h3>
                            <Badge variant="outline" className="text-xs capitalize">
                              {course.difficulty}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mb-3 flex items-center gap-4 text-sm">
                            <span>
                              {course.lessonsCompleted}/{course.totalLessons} lessons
                            </span>
                            <span>{course.progress}% complete</span>
                          </div>
                          <Progress value={course.progress} className="mb-3 h-2" />
                          {course.nextLesson && (
                            <div className="flex items-center gap-2 text-sm">
                              <PlayCircle className="h-4 w-4 text-blue-400" />
                              <span className="text-muted-foreground">Next:</span>
                              <span className="truncate text-blue-400">
                                {course.nextLesson.title}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button size="sm" asChild className="shrink-0">
                          <Link
                            href={
                              course.nextLesson
                                ? `/courses/${course.slug}/lessons/${course.nextLesson.slug}`
                                : `/courses/${course.slug}`
                            }
                          >
                            Continue
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Courses Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    Recommended for You
                  </CardTitle>
                  <CardDescription>Courses you might enjoy</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/discover">
                    Explore All <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendedCourses.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">
                  You&apos;ve enrolled in all available courses! 🎉
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendedCourses.slice(0, 4).map((course) => (
                    <Link
                      key={course.id}
                      href={`/explore/${course.slug}`}
                      className="group bg-muted/30 hover:bg-muted/50 rounded-lg border border-border p-4 transition-colors hover:border-green-500/50"
                    >
                      <h4 className="mb-1 line-clamp-1 font-medium transition-colors group-hover:text-green-400">
                        {course.title}
                      </h4>
                      <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                        {course.description}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="capitalize">
                          {course.difficulty}
                        </Badge>
                        <span>•</span>
                        <span>{course.lessonsCount} lessons</span>
                        <span>•</span>
                        <span className="text-purple-400">+{course.xpReward} XP</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">
                  No recent activity. Start learning to see your progress here!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {activity.xpEarned && (
                        <Badge variant="secondary" className="text-xs">
                          +{activity.xpEarned} XP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Streak Calendar & Achievements */}
        <div className="space-y-6">
          {/* Streak Calendar Card */}
          <Card className="border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-orange-400" />
                Streak Calendar
              </CardTitle>
              <CardDescription>Your activity over the last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <StreakCalendar streakHistory={streakData.streakHistory} />
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-400">{streakData.currentStreak}</p>
                  <p className="text-muted-foreground text-xs">Current Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-300">{streakData.longestStreak}</p>
                  <p className="text-muted-foreground text-xs">Best Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Achievements
                </CardTitle>
                <Badge variant="secondary">{achievements.length} unlocked</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recentAchievements.length === 0 ? (
                <div className="py-6 text-center">
                  <Trophy className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                  <p className="text-muted-foreground text-sm">
                    Complete courses to earn achievements!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {recentAchievements.map((achievement, index) => {
                    const IconComponent = getLucideIcon(achievement.icon);
                    return (
                      <div
                        key={`${achievement.achievementId || 'achievement'}-${achievement.unlockedAt || 'no-date'}-${index}`}
                        className="group bg-muted/30 hover:bg-muted/50 relative flex flex-col items-center rounded-lg border border-border p-3 transition-colors hover:border-yellow-500/50"
                        title={achievement.name}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            achievement.rarity === 'legendary'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : achievement.rarity === 'epic'
                                ? 'bg-purple-500/20 text-purple-400'
                                : achievement.rarity === 'rare'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {IconComponent && <IconComponent className="h-5 w-5" />}
                        </div>
                        <p className="mt-2 line-clamp-1 text-center text-xs">{achievement.name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
                <Link href="/profile#achievements">
                  View All Achievements <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/challenges">
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                  Daily Challenges
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/leaderboard">
                  <Medal className="mr-2 h-4 w-4 text-orange-400" />
                  View Leaderboard
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile?tab=achievements">
                  <Trophy className="mr-2 h-4 w-4 text-purple-400" />
                  My Achievements
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile?tab=certificates">
                  <Award className="mr-2 h-4 w-4 text-blue-400" />
                  My Certificates
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Streak Calendar Component
function StreakCalendar({
  streakHistory,
}: {
  streakHistory: Array<{ date: string; hasActivity: boolean }>;
}) {
  const weeks = 12;
  const today = new Date();
  const dates: Date[] = [];

  // Generate last N weeks of dates
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  // Group by weeks
  const weekGroups: Date[][] = [];
  for (let i = 0; i < dates.length; i += 7) {
    weekGroups.push(dates.slice(i, i + 7));
  }

  // Format date as YYYY-MM-DD for comparison
  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Create a set of active days
  const activeDaysSet = new Set(
    streakHistory.filter((day) => day.hasActivity).map((day) => day.date)
  );

  const isActive = (date: Date) => activeDaysSet.has(formatDate(date));
  const isToday = (date: Date) => formatDate(date) === formatDate(today);

  return (
    <div className="flex justify-center gap-1">
      {weekGroups.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((date, dayIndex) => {
            const active = isActive(date);
            const todayClass = isToday(date);

            return (
              <div
                key={dayIndex}
                className={`h-3 w-3 rounded-sm ${
                  active
                    ? 'bg-orange-500'
                    : todayClass
                      ? 'bg-muted ring-1 ring-orange-400'
                      : 'bg-muted/70'
                }`}
                title={formatDate(date)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-60 rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
