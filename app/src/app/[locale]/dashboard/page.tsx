"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseCards } from "@/lib/courses";
import { useEnrollments } from "@/hooks/use-enrollments";
import { RentReclaimBanner } from "@/components/dashboard/rent-reclaim-banner";
import type { CourseCardData } from "@/types/course";
import type { StreakData, Achievement, XPTransaction } from "@/types/gamification";
import {
  Star,
  Flame,
  Trophy,
  BookOpen,
  Target,
  ChevronRight,
  Zap,
  Calendar,
  Award,
} from "lucide-react";

interface DashboardStats {
  totalXP: number;
  level: number;
  rank: number;
  currentStreak: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  streak: StreakData;
}

const DEFAULT_STATS: DashboardStats = {
  totalXP: 0,
  level: 0,
  rank: 0,
  currentStreak: 0,
  coursesCompleted: 0,
  lessonsCompleted: 0,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakFreezes: 3,
    isActiveToday: false,
  },
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();

  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activity, setActivity] = useState<XPTransaction[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [allCourses, setAllCourses] = useState<CourseCardData[]>([]);

  // Load course cards
  useEffect(() => {
    getCourseCards()
      .then(setAllCourses)
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  // Batch on-chain enrollment check
  const { enrollments, loading: loadingEnrollments } = useEnrollments(allCourses);

  const enrolledCourses = allCourses
    .filter((c) => c.courseId && enrollments.some((e) => e.courseId === c.courseId))
    .map((c) => {
      const e = enrollments.find((e) => e.courseId === c.courseId)!;
      return { ...c, progress: e.progressPct };
    });

  // "Completed" = all lessons done (100%) OR finalize_course has run (completedAt set)
  const coursesCompleted = enrollments.filter(
    (e) => e.progressPct >= 100 || e.completedAt !== null,
  ).length;

  // Completed enrollments whose accounts can be closed to reclaim rent
  const completedEnrollments = allCourses.flatMap((c) => {
    if (!c.courseId) return [];
    const e = enrollments.find((e) => e.courseId === c.courseId);
    if (!e || (e.progressPct < 100 && e.completedAt === null)) return [];
    return [{ courseId: c.courseId, title: c.title }];
  });

  // Load user data from API
  useEffect(() => {
    // Wait for next-auth to finish checking — avoids flashing zeros while session loads
    if (status === "loading") return;
    if (!session?.user) {
      setLoadingStats(false);
      setLoadingAchievements(false);
      setLoadingActivity(false);
      return;
    }

    // Fetch gamification stats
    fetch("/api/gamification?type=stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.xp !== undefined) {
          setStats((prev) => ({
            ...prev,
            totalXP: data.xp,
            level: data.level,
            currentStreak: data.streak?.currentStreak ?? 0,
            streak: data.streak ?? prev.streak,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    // Fetch achievements
    fetch("/api/gamification?type=achievements")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAchievements(data);
      })
      .catch(() => {})
      .finally(() => setLoadingAchievements(false));

    // Fetch XP history
    fetch("/api/gamification?type=history&limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivity(data);
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));

  }, [session, status]);

  const displayAchievements =
    achievements.length > 0
      ? achievements.slice(0, 6)
      : [
          { id: 0, name: "First Steps", icon: "footprints", category: "progress" as const, xpReward: 50, unlocked: false },
          { id: 3, name: "Week Warrior", icon: "flame", category: "streak" as const, xpReward: 100, unlocked: false },
          { id: 1, name: "Course Completer", icon: "graduation-cap", category: "progress" as const, xpReward: 200, unlocked: false },
          { id: 2, name: "Speed Runner", icon: "zap", category: "progress" as const, xpReward: 500, unlocked: false },
          { id: 6, name: "Rust Rookie", icon: "code", category: "skill" as const, xpReward: 150, unlocked: false },
          { id: 8, name: "Early Adopter", icon: "star", category: "special" as const, xpReward: 250, unlocked: false },
        ];

  // Build the last 28 days as a real calendar grid
  const streakDays = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine when the streak ended (today if active, lastActivityDate otherwise)
    let streakEnd: Date | null = null;
    if (stats.streak.isActiveToday) {
      streakEnd = today;
    } else if (stats.streak.lastActivityDate) {
      const d = new Date(stats.streak.lastActivityDate);
      d.setHours(0, 0, 0, 0);
      streakEnd = d;
    }

    return Array.from({ length: 28 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 27 + i);

      let active = false;
      if (streakEnd && stats.currentStreak > 0) {
        const diffDays = Math.round((streakEnd.getTime() - date.getTime()) / 86400000);
        active = diffDays >= 0 && diffDays < stats.currentStreak;
      }

      return { date, active, isToday: i === 27 };
    });
  })();

  // Column headers derived from the actual starting weekday (Su=0 … Sa=6)
  const WEEKDAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const calendarHeaders = Array.from({ length: 7 }, (_, i) =>
    WEEKDAY_ABBR[(streakDays[0].date.getDay() + i) % 7],
  );

  // Month label — show range if the 28-day window spans two months
  const firstDay = streakDays[0].date;
  const lastDay = streakDays[streakDays.length - 1].date;
  const monthLabel = firstDay.getMonth() === lastDay.getMonth()
    ? firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : `${firstDay.toLocaleDateString(undefined, { month: "short" })} – ${lastDay.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;

  function formatTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  function sourceLabel(source: string): string {
    switch (source) {
      case "lesson": return "Completed lesson";
      case "challenge": return "Passed challenge";
      case "streak": return "Streak bonus";
      case "achievement": return "Achievement unlocked";
      case "course": return "Course completed";
      case "daily_first": return "Daily first login";
      default: return source;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("welcome")}!</p>
      </div>

      {/* Rent reclaim banner — only shown when wallet connected and completed enrollments exist */}
      {!loadingEnrollments && completedEnrollments.length > 0 && (
        <RentReclaimBanner courses={completedEnrollments} />
      )}

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              {loadingStats ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground">{t("totalXP")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
              <Zap className="h-6 w-6 text-gold" />
            </div>
            <div>
              {loadingStats ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{tc("level")} {stats.level}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {stats.rank > 0 ? `${t("rank")} #${stats.rank}` : t("rank")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              {loadingStats ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {tc("streak")} ({tc("days")})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-brand/10">
              <Trophy className="h-6 w-6 text-green-brand" />
            </div>
            <div>
              {(loadingCourses || loadingEnrollments) ? (
                <Skeleton className="h-7 w-8 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{coursesCompleted}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("coursesCompleted")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Active Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("activeCourses")}</CardTitle>
              <Link href="/courses">
                <Button variant="ghost" size="sm" className="gap-1">
                  {tc("viewAll")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {(loadingCourses || loadingEnrollments) ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg p-3">
                      <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("noCourses")}
                  </p>
                  <Link href="/courses">
                    <Button variant="outline" className="mt-4">
                      {t("exploreCourses")}
                    </Button>
                  </Link>
                </div>
              ) : (
                enrolledCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <div className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{course.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress
                            value={course.progress}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(course.progress)}%
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {tc("continue")}
                      </Button>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Streak Calendar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  {t("streakCalendar")}
                </CardTitle>
                {!loadingStats && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold">{stats.currentStreak}</span>
                      <span className="text-muted-foreground">{tc("days")}</span>
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground">
                      Best: <span className="font-medium text-foreground">{stats.streak.longestStreak}</span>
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 mb-3" />
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-3 w-full" />
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">{monthLabel}</p>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarHeaders.map((day, i) => (
                      <div key={i} className="text-center text-[11px] font-medium text-muted-foreground/70 pb-1">
                        {day}
                      </div>
                    ))}
                    {streakDays.map((day, i) => (
                      <div
                        key={i}
                        title={day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        className={`flex h-9 items-center justify-center rounded-lg text-[11px] font-semibold transition-all
                          ${day.active
                            ? "bg-orange-500 shadow-sm shadow-orange-500/30"
                            : "bg-muted/60 hover:bg-muted"
                          }
                          ${day.isToday
                            ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background"
                            : ""
                          }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full
                            ${day.active ? "text-white" : "text-muted-foreground/60"}`}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-8 rounded-md bg-orange-500" />
                      Active day
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-8 rounded-md bg-muted/60 ring-2 ring-orange-500 ring-offset-1 ring-offset-background" />
                      Today
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Daily Challenge */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("dailyChallenge")}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                What is the maximum theoretical TPS of Solana?
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary">Quiz</Badge>
                <span className="text-sm font-medium text-primary">
                  50 {tc("xp")}
                </span>
              </div>
              <Button className="mt-4 w-full" size="sm">
                Start Challenge
              </Button>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                {t("achievements")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAchievements ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : null}
              <div className={`grid grid-cols-3 gap-3 ${loadingAchievements ? "hidden" : ""}`}>
                {displayAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center ${
                      ach.unlocked ? "bg-primary/10" : "bg-muted opacity-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        ach.unlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20"
                      }`}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight">
                      {ach.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingActivity ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="mt-0.5 h-6 w-6 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet. Start a course to earn XP!
                </p>
              ) : (
                activity.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Star className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{sourceLabel(tx.source)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          +{tx.amount} {tc("xp")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
