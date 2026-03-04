"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { useCoursesCompleted } from "@/hooks/use-courses-completed";
import { CredentialClaimBanner } from "@/components/dashboard/credential-claim-banner";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { AchievementGrid } from "@/components/dashboard/achievement-grid";
import { StatsBar } from "@/components/stats-bar";
import type { Achievement, XPTransaction } from "@/types/gamification";
import {
  Star,
  Flame,
  BookOpen,
  ChevronRight,
  Calendar,
  Award,
  Info,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "@/components/ui/popover";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (status === "unauthenticated") {
      const locale = pathname.split("/")[1] || "en";
      router.replace(`/${locale}/auth/signin`);
    }
  }, [status, router, pathname]);

  // Resolve wallet: undefined while session loading, null if no wallet, string if linked
  const walletAddress = status === "loading" ? undefined : (session?.walletAddress ?? null);

  // On-chain XP, level, streak via shared hook
  const playerStats = usePlayerStats(walletAddress);

  // Courses completed (credentials + finalized enrollments) via shared hook
  const {
    coursesCompleted,
    credentials,
    allCourses,
    enrollments,
    loading: loadingCoursesCompleted,
    loadingEnrollments,
  } = useCoursesCompleted(walletAddress);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [eligible, setEligible] = useState<string[]>([]);
  const [activity, setActivity] = useState<XPTransaction[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Load achievements + XP history from API
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      if (status !== "loading") {
        setLoadingAchievements(false);
        setLoadingActivity(false);
      }
      return;
    }

    Promise.all([
      fetch("/api/gamification?type=achievements").then((r) => r.json()),
      fetch("/api/gamification?type=eligible").then((r) => r.json()),
    ])
      .then(([achData, eligibleData]) => {
        if (Array.isArray(achData)) setAchievements(achData);
        if (Array.isArray(eligibleData)) setEligible(eligibleData);
      })
      .catch(() => {})
      .finally(() => setLoadingAchievements(false));

    fetch("/api/gamification?type=history&limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivity(data);
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));

  }, [session, status]);

  // Show skeleton while auth is resolving or redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const enrolledCourses = allCourses
    .filter((c) => c.courseId && enrollments.some((e) => e.courseId === c.courseId))
    .map((c) => {
      const e = enrollments.find((e) => e.courseId === c.courseId)!;
      return { ...c, progress: e.progressPct };
    });

  // Finalized enrollments that still need credential collection.
  // Exclude courses where:
  // 1. The enrollment already has credentialAsset set (original issue course)
  // 2. The course appears in a credential's completedCourseIds (from DAS URI)
  const credentialCourseIds = new Set(
    credentials.flatMap((c) => c.completedCourseIds ?? []),
  );
  const credentialTrackIds = new Set(credentials.map((c) => c.trackId));
  const uncollectedEnrollments = allCourses.flatMap((c) => {
    if (!c.courseId) return [];
    if (credentialCourseIds.has(c.courseId)) return [];
    const e = enrollments.find((e) => e.courseId === c.courseId);
    if (!e) return [];
    const isFinalized = e.progressPct >= 100 || e.completedAt !== null;
    if (!isFinalized) return [];
    // Skip if this enrollment already had a credential issued through it
    if (
      e.credentialAsset &&
      e.credentialAsset.toBase58() !== "11111111111111111111111111111111"
    ) return [];
    return [{ courseId: c.courseId, title: c.title }];
  });

  const streak = playerStats.streak;

  // Build the last 28 days as a real calendar grid using actual activity dates
  const streakDays = (() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const activeDatesSet = new Set(streak?.activityDates ?? []);
    const frozenDatesSet = new Set(streak?.frozenDates ?? []);

    return Array.from({ length: 28 }, (_, i) => {
      const date = new Date(todayUTC);
      date.setUTCDate(todayUTC.getUTCDate() - 27 + i);
      const dateStr = date.toISOString().split("T")[0];

      return {
        date,
        active: activeDatesSet.has(dateStr),
        frozen: frozenDatesSet.has(dateStr),
        isToday: i === 27,
      };
    });
  })();

  // Column headers derived from the actual starting weekday (Su=0 … Sa=6)
  const locale = pathname.split("/")[1] || "en";
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const calendarHeaders = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(streakDays[0].date);
    d.setUTCDate(d.getUTCDate() + i);
    return weekdayFormatter.format(d);
  });

  // Month label — show range if the 28-day window spans two months
  const firstDay = streakDays[0].date;
  const lastDay = streakDays[streakDays.length - 1].date;
  const monthFmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, { ...opts, timeZone: "UTC" }).format(d);
  const monthLabel = firstDay.getUTCMonth() === lastDay.getUTCMonth()
    ? monthFmt(firstDay, { month: "long", year: "numeric" })
    : `${monthFmt(firstDay, { month: "short" })} – ${monthFmt(lastDay, { month: "short", year: "numeric" })}`;

  function formatTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t("justNow");
    if (hours < 24) return t("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    if (days === 1) return t("yesterday");
    return t("daysAgo", { count: days });
  }

  function sourceLabel(source: string, courseName?: string, achievementName?: string): string {
    const base = (() => {
      switch (source) {
        case "lesson": return t("sourceLesson");
        case "course": return t("sourceCourse");
        case "creator_reward": return t("sourceCreatorReward");
        case "achievement": return t("sourceAchievement");
        case "reward": return t("sourceReward");
        default: return source;
      }
    })();
    const detail = courseName || achievementName;
    return detail ? `${base} · ${detail}` : base;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("welcome")}!</p>
      </div>

      {/* Rent reclaim banner — only shown when wallet connected and completed enrollments exist */}
      {!loadingCoursesCompleted && uncollectedEnrollments.length > 0 && (
        <CredentialClaimBanner courses={uncollectedEnrollments} />
      )}

      {/* Stats Row */}
      <div className="mb-8">
        <StatsBar
          xp={playerStats.xp}
          streak={streak?.currentStreak ?? 0}
          coursesCompleted={coursesCompleted}
          loadingStats={playerStats.loading}
          loadingCourses={loadingCoursesCompleted}
          variant="cards"
          streakFreezes={streak?.streakFreezes}
        />
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
              {(loadingCoursesCompleted) ? (
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
                {!playerStats.loading && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold">{streak?.currentStreak ?? 0}</span>
                      <span className="text-muted-foreground">{tc("days")}</span>
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground">
                      {t("best")}: <span className="font-medium text-foreground">{streak?.longestStreak ?? 0}</span>
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64">
                        <PopoverHeader>
                          <PopoverTitle>{t("streakInfoTitle")}</PopoverTitle>
                          <PopoverDescription>{t("streakInfoDesc")}</PopoverDescription>
                        </PopoverHeader>
                        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          <p>{t("streakInfoFreezes", { count: streak?.streakFreezes ?? 0 })}</p>
                          <p>{t("streakInfoReplenish")}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {playerStats.loading ? (
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
                        title={new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(day.date)}
                        className={`flex h-9 items-center justify-center rounded-lg text-[11px] font-semibold transition-all
                          ${day.active
                            ? "bg-orange-500 shadow-sm shadow-orange-500/30"
                            : day.frozen
                              ? "bg-blue-400/80 shadow-sm shadow-blue-400/20"
                              : "bg-muted/60 hover:bg-muted"
                          }
                          ${day.isToday
                            ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background"
                            : ""
                          }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full
                            ${day.active ? "text-white" : day.frozen ? "text-white" : "text-muted-foreground/60"}`}
                        >
                          {day.date.getUTCDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-8 rounded-md bg-orange-500" />
                      {t("activeDay")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-8 rounded-md bg-blue-400/80" />
                      {t("frozenDay")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-8 rounded-md bg-muted/60 ring-2 ring-orange-500 ring-offset-1 ring-offset-background" />
                      {t("today")}
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
          <DailyChallengeCard />

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                {t("achievements")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementGrid
                achievements={achievements}
                eligible={eligible}
                loading={loadingAchievements}
              />
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
              ) : !session?.walletAddress ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("linkWalletForActivity")}
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="mt-2">
                      {tc("settings")}
                    </Button>
                  </Link>
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noActivityYet")}
                </p>
              ) : (
                activity.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Star className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{sourceLabel(tx.source, (tx as unknown as { courseName?: string }).courseName, (tx as unknown as { achievementName?: string }).achievementName)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          +{tx.amount} {tc("xp")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(tx.transactionAt)}
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
