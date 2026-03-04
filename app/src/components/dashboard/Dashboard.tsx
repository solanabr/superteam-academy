"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { Trophy, Zap, BookOpen, Flame, Star, CheckCircle2, ChevronRight, Wallet, Award, ChevronDown, Heart, Hash, Sparkles, TrendingUp, ShieldCheck, ClipboardList } from "lucide-react";
import { AchievementBadges } from "@/components/gamification/AchievementBadges";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import { getLevel, getLevelProgress, formatXp, truncateAddress, difficultyColors } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useProgressStore } from "@/stores/progress-store";
import { useActivityStore, type Activity } from "@/stores/activity-store";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { LevelUpModal, useLevelUp } from "@/components/gamification/LevelUpModal";
import type { SanityCourse } from "@/lib/sanity/queries";
import type { TokenHolder } from "@/lib/solana/helius";
import { motion, Variants } from "framer-motion";
import { SpotlightCard } from "@/components/shared/SpotlightCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function formatCourseId(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function activityLabel(activity: Activity, t: ReturnType<typeof useTranslations<"dashboard">>): string {
  switch (activity.type) {
    case "lesson_completed":
      return activity.lessonTitle
        ? `${t("recentActivity.lessonCompleted")}: "${activity.lessonTitle}"`
        : t("recentActivity.lessonCompleted");
    case "course_enrolled":
      return activity.courseTitle
        ? `${t("recentActivity.courseEnrolled")}: "${activity.courseTitle}"`
        : t("recentActivity.courseEnrolled");
    case "course_completed":
      return activity.courseTitle
        ? `${t("recentActivity.courseCompleted")}: "${activity.courseTitle}"`
        : t("recentActivity.courseCompleted");
    case "achievement_earned":
      return t("recentActivity.achievementEarned");
  }
}

function timeAgo(timestamp: number, t: ReturnType<typeof useTranslations<"dashboard">>): string {
  const diff = Date.now() - timestamp;
  if (diff < 0) return t("time.justNow");
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hoursAgo", { count: hrs });
  return t("time.daysAgo", { count: Math.floor(hrs / 24) });
}

function RecommendationCard({ course }: { course: SanityCourse }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("courses");

  const difficultyLabel =
    course.difficulty === 1
      ? tc("filter.beginner")
      : course.difficulty === 2
        ? tc("filter.intermediate")
        : tc("filter.advanced");

  return (
    <div className="flex w-56 shrink-0 flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs ${difficultyColors[course.difficulty]}`}
        >
          {difficultyLabel}
        </Badge>
      </div>
      <div className="flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{course.title}</p>
        {course.lessons?.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {course.lessons.length} {tc("card.lessons")}
          </p>
        )}
      </div>
      <Link href={`/courses/${course.slug}` as string}>
        <Button size="sm" className="w-full gap-1" variant="outline">
          {t("recommendations.start")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </Link>
    </div>
  );
}

function AchievementSection() {
  const t = useTranslations("achievements");
  const [open, setOpen] = useState(false);
  const { publicKey } = useWallet();
  const { unlockedBitmap } = useAchievements(publicKey);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="achievement-grid"
        >
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent id="achievement-grid">
          <AchievementBadges compact unlockedBitmap={unlockedBitmap} />
        </CardContent>
      )}
    </Card>
  );
}

interface DashboardProps {
  courses: SanityCourse[];
}

export function Dashboard({ courses }: DashboardProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tq = useTranslations("onboardingQuiz");
  const { data: session, status: sessionStatus } = useSession();
  const { connected, publicKey } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { xp, loading: xpLoading } = useXpBalance();
  const { streakDays, completedLessons, streakFreezeCount, streakFreezeActive } = useProgressStore();
  const { activities } = useActivityStore();
  const { levelUpOpen, oldLevel, newLevel, closeLevelUp } = useLevelUp();
  const { bookmarkedCourses } = useBookmarkStore();
  const [rank, setRank] = useState<number | null>(null);
  const quizCompleted = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => !!localStorage.getItem("onboarding-quiz-completed"),
    () => true, // server snapshot: assume completed to avoid flash
  );

  useEffect(() => {
    if (!publicKey) return;
    const walletAddr = publicKey.toBase58();
    fetch("/api/helius/leaderboard")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: TokenHolder[]) => {
        const idx = data.findIndex((h) => h.owner === walletAddr);
        setRank(idx >= 0 ? idx + 1 : null);
      })
      .catch(() => setRank(null));
  }, [publicKey]);

  if (sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8" role="status" aria-label={tc("loading")}>
        {/* Welcome banner skeleton */}
        <Skeleton className="h-40 w-full rounded-xl mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full lg:col-span-2 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="col-span-full h-40 rounded-xl" />
          <div className="col-span-full grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <EmptyState
          icon={BookOpen}
          title={t("signInRequired.title")}
          description={t("signInRequired.description")}
          action={
            <Link href="/auth/signin">
              <Button>{t("signInRequired.cta")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 text-center">
          <Wallet className="mx-auto mb-4 h-10 w-10 text-primary/60" aria-hidden="true" />
          <h2 className="text-xl font-bold">{t("walletRequired.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {t("walletRequired.description")}
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setWalletModalVisible(true)}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            {tc("connectWallet")}
          </Button>
        </div>
      </div>
    );
  }

  const level = getLevel(xp);
  const levelProgress = getLevelProgress(xp);

  // Derive active course summaries from progress store.
  // Use real lesson count from the courses prop when available; fall back to maxIndex + 1.
  const activeCourses = Object.entries(completedLessons)
    .filter(([, set]) => set.size > 0)
    .map(([courseId, set]) => {
      const completedCount = set.size;
      const maxIndex = set.size > 0 ? Math.max(...Array.from(set)) : 0;
      const matchingCourse = courses.find(
        (c) => c.slug === courseId || c.onChainCourseId === courseId
      );
      const estimatedTotal = matchingCourse?.lessons?.length ?? maxIndex + 1;
      const sortedLessons = matchingCourse?.lessons
        ? [...matchingCourse.lessons].sort((a, b) => a.lessonIndex - b.lessonIndex)
        : [];
      const nextLesson = sortedLessons[completedCount] ?? null;
      const nextLessonTitle = nextLesson?.title ?? null;
      return { courseId, completedCount, estimatedTotal, nextLessonTitle };
    })
    .slice(0, 5);

  // Recommended courses: courses the user has NOT started yet
  const enrolledCourseIds = new Set(Object.keys(completedLessons));
  const recommendedCourses = courses
    .filter((c) => !enrolledCourseIds.has(c.slug) && !enrolledCourseIds.has(c.onChainCourseId))
    .slice(0, 8);

  // Saved/bookmarked courses
  const savedCourses = courses.filter((c) => bookmarkedCourses.includes(c.slug));

  // XP ring geometry: r=45 → circumference = 2π×45 ≈ 282.7
  const RING_CIRC = 282.7;
  const ringOffset = RING_CIRC - (levelProgress / 100) * RING_CIRC;
  const totalLessonsCompleted = Object.values(completedLessons).reduce((s, set) => s + set.size, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* ── Welcome banner — RPG player card ── */}
      <div
        className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 banner-noise shadow-2xl backdrop-blur-xl"
        aria-label={t("welcome")}
      >
        {/* Animated dot-grid layer */}
        <div className="banner-dot-grid pointer-events-none absolute inset-0 rounded-2xl opacity-60" aria-hidden="true" />

        {/* Subtle radial glow blobs */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          {/* Left — identity */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t("welcome")}</h1>
            {publicKey && (
              <p className="mt-1 text-sm text-muted-foreground font-mono tracking-wider">
                {truncateAddress(publicKey.toBase58(), 6)}
              </p>
            )}

            {/* Stat pill badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {/* XP badge */}
              {xpLoading ? (
                <Skeleton className="h-8 w-24 rounded-full" />
              ) : (
                <div className="stat-pill flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold xp-glow-text text-secondary">
                    {formatXp(xp)} {tc("xp")}
                  </span>
                </div>
              )}

              {/* Streak badge — pulses when active */}
              <div
                className={cn(
                  "stat-pill flex items-center gap-1.5 rounded-full px-3 py-1.5",
                  streakDays > 0 && "streak-pulse-active"
                )}
              >
                <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  {streakDays}{tc("daysShort")}
                </span>
              </div>

              {/* Streak freeze badge */}
              {(streakFreezeCount > 0 || streakFreezeActive) && (
                <div
                  className={cn(
                    "stat-pill flex items-center gap-1.5 rounded-full px-3 py-1.5",
                    streakFreezeActive
                      ? "border-blue-500/40 bg-blue-500/15"
                      : "border-blue-500/20 bg-blue-500/8"
                  )}
                  title={t("streakFreezes")}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-blue-400">
                    {streakFreezeActive ? t("freezeUsed") : `${streakFreezeCount}x`}
                  </span>
                </div>
              )}

              {/* Rank badge — gold shimmer if top 10 */}
              {rank !== null && (
                <div
                  className={cn(
                    "stat-pill flex items-center gap-1.5 rounded-full px-3 py-1.5",
                    rank <= 10 && "border-yellow-500/40 bg-yellow-500/10"
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" aria-hidden="true" />
                  <span className={cn("text-xs font-semibold", rank <= 10 ? "rank-top10-text" : "")}>
                    #{rank}
                  </span>
                </div>
              )}

              {/* Lessons completed badge */}
              <div className="stat-pill flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  {totalLessonsCompleted} {tc("lessonsDone")}
                </span>
              </div>
            </div>
          </div>

          {/* Right — Circular XP / Level ring */}
          {xpLoading ? (
            <Skeleton className="h-28 w-28 rounded-full shrink-0" />
          ) : (
            <div className="flex shrink-0 flex-col items-center gap-1 self-center" aria-label={`${t("level")} ${level}, ${levelProgress}% ${t("levelProgress")}`}>
              <div className="relative h-28 w-28">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full -rotate-90"
                  aria-hidden="true"
                >
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="xp-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(160 100% 51%)" />
                      <stop offset="100%" stopColor="hsl(262 83% 58%)" />
                    </linearGradient>
                  </defs>
                  {/* Track ring */}
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="url(#xp-ring-grad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="xp-ring-progress"
                    style={{ "--ring-offset": `${ringOffset}` } as React.CSSProperties}
                  />
                </svg>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold leading-none tabular-nums">{level}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {t("level")}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {levelProgress}% → {t("level")} {level + 1}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Onboarding quiz banner ── */}
      {!quizCompleted && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 to-secondary/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm">{tq("banner.title")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tq("banner.description")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-13 sm:pl-0">
            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary">
              {tq("banner.xpReward")}
            </span>
            <Link href="/onboarding">
              <Button size="sm" className="gap-1.5">
                {tq("banner.cta")}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
        {/* Active Courses */}
        <Card className="col-span-full lg:col-span-4 border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              {t("activeCourses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={t("empty.title")}
                description={t("empty.description")}
                action={
                  <Link href="/courses">
                    <Button>{t("empty.cta")}</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {activeCourses.map(({ courseId, completedCount, estimatedTotal, nextLessonTitle }) => (
                  <div
                    key={courseId}
                    className="flex items-center gap-4 rounded-lg border border-border/50 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">{formatCourseId(courseId)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={estimatedTotal > 0 ? Math.min(100, Math.round((completedCount / estimatedTotal) * 100)) : 0} className="h-2 flex-1" aria-label={tc("courseProgress")} />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {tc("lessonsCount", { count: completedCount })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/courses/${courseId}?resume=true` as string}>
                      <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-1.5 px-3">
                        <span>{t("continueLearning")}</span>
                        {nextLessonTitle && (
                          <span className="max-w-[140px] truncate text-[10px] font-normal text-muted-foreground leading-tight">
                            {nextLessonTitle}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Courses */}
        <Card className="col-span-full border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" aria-hidden="true" />
              {t("savedCourses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedCourses.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={t("savedEmpty")}
                action={
                  <Link href="/courses">
                    <Button variant="outline" size="sm">{tc("viewAll")}</Button>
                  </Link>
                }
              />
            ) : (
              <div
                className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                role="region"
                aria-label={t("savedCourses")}
                tabIndex={0}
              >
                {savedCourses.map((course) => (
                  <div key={course._id} className="snap-start">
                    <RecommendationCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="col-span-full md:col-span-1 lg:col-span-2 overflow-hidden border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" aria-hidden="true" />
              {t("achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-2.5"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >

              {/* Lessons completed */}
              <motion.div variants={itemVariants}>
                {(() => {
                  const count = totalLessonsCompleted;
                  const pct = Math.min(100, (count / 50) * 100); // milestone: 50 lessons
                  return (
                    <SpotlightCard className="px-3.5 py-2.5 group" variant="secondary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 group-hover:text-green-300 transition-colors" aria-hidden="true" />
                          <span className="font-bold tracking-tight-premium text-muted-foreground group-hover:text-white transition-colors">{tc("lessonsDone")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {count >= 10 && <Sparkles className="sparkle-icon h-3 w-3 text-green-400 group-hover:text-white transition-colors" aria-hidden="true" />}
                          <span className="font-bold tabular-nums group-hover:text-white transition-colors">{count}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-green-500/15">
                        <div
                          className="stat-bar-fill progress-shimmer h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ "--stat-pct": `${pct}%` } as React.CSSProperties}
                          aria-label={`${pct.toFixed(0)}% to next milestone`}
                        />
                      </div>
                    </SpotlightCard>
                  );
                })()}
              </motion.div>

              {/* Streak */}
              <motion.div variants={itemVariants}>
                {(() => {
                  const pct = Math.min(100, (streakDays / 30) * 100); // milestone: 30-day streak
                  return (
                    <SpotlightCard className="px-3.5 py-2.5 group" variant="accent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Flame className="h-4 w-4 text-orange-400 shrink-0 group-hover:text-orange-300 transition-colors" aria-hidden="true" />
                          <span className="font-bold tracking-tight-premium text-muted-foreground group-hover:text-white transition-colors">{t("streak.title")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {streakDays >= 7 && <Sparkles className="sparkle-icon h-3 w-3 text-orange-400 group-hover:text-white transition-colors" aria-hidden="true" />}
                          <span className="font-bold tabular-nums group-hover:text-white transition-colors">{streakDays}{tc("daysShort")}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-orange-500/15">
                        <div
                          className="stat-bar-fill progress-shimmer h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                          style={{ "--stat-pct": `${pct}%` } as React.CSSProperties}
                          aria-label={`${pct.toFixed(0)}% to 30-day streak`}
                        />
                      </div>
                    </SpotlightCard>
                  );
                })()}
              </motion.div>

              {/* Level */}
              <motion.div variants={itemVariants}>
                <SpotlightCard className="px-3.5 py-2.5 group" variant="primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-primary shrink-0 group-hover:text-white transition-colors" aria-hidden="true" />
                      <span className="font-bold tracking-tight-premium text-muted-foreground group-hover:text-white transition-colors">{t("level")}</span>
                    </div>
                    <span className="font-bold tabular-nums group-hover:text-white transition-colors">{level}</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary/15">
                    <div
                      className="stat-bar-fill progress-shimmer h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ "--stat-pct": `${levelProgress}%` } as React.CSSProperties}
                      aria-label={t("levelProgress")}
                    />
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* Rank */}
              <motion.div variants={itemVariants}>
                <SpotlightCard className="px-3.5 py-2.5 group" variant="accent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-yellow-500 shrink-0 group-hover:text-yellow-300 transition-colors" aria-hidden="true" />
                      <span className="font-bold tracking-tight-premium text-muted-foreground group-hover:text-white transition-colors">{t("rank")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {rank !== null && rank <= 10 && (
                        <TrendingUp className="h-3 w-3 text-yellow-500 shrink-0 group-hover:scale-110 group-hover:text-white transition-all" aria-hidden="true" />
                      )}
                      <span className={cn(
                        "font-bold tabular-nums group-hover:text-white transition-colors",
                        rank !== null && rank <= 10 ? "rank-top10-text" : ""
                      )}>
                        {rank !== null ? `#${rank}` : t("unranked")}
                      </span>
                    </div>
                  </div>
                  {/* Mini leaderboard bar — position indicator */}
                  {rank !== null && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-yellow-500/15">
                        <div
                          className="stat-bar-fill progress-shimmer h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                          style={{
                            "--stat-pct": `${Math.max(5, 100 - (rank - 1) * 2)}%`
                          } as React.CSSProperties}
                          aria-label={`Rank #${rank} leaderboard position`}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">Top</span>
                    </div>
                  )}
                </SpotlightCard>
              </motion.div>

            </motion.div>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card className="col-span-full lg:col-span-4 border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" aria-hidden="true" />
              {t("streak.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap />
          </CardContent>
        </Card>

        {/* Streak Calendar (compact, activity-store-based) */}
        <Card className="col-span-full lg:col-span-2 border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4" aria-hidden="true" />
              Activity feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCalendar />
          </CardContent>
        </Card>

        {/* Achievement Badge Grid */}
        <AchievementSection />

        {/* Course Recommendations */}
        <Card className="col-span-full border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" aria-hidden="true" />
                {t("recommendations.title")}
              </CardTitle>
              <Link href="/courses">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {tc("viewAll")}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recommendedCourses.length === 0 ? (
              <EmptyState
                icon={Star}
                title={t("recommendations.empty")}
              />
            ) : (
              <div
                className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                role="region"
                aria-label={t("recommendations.title")}
                tabIndex={0}
              >
                {recommendedCourses.map((course) => (
                  <div key={course._id} className="snap-start">
                    <RecommendationCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-full border-white/8 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t("recentActivity.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center" aria-live="polite">
                <div className="rounded-full bg-muted p-5 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-muted-foreground">{t("recentActivity.noActivity")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span className="text-sm">{activityLabel(activity, t)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {activity.xpEarned && (
                        <Badge variant="outline">+{activity.xpEarned} XP</Badge>
                      )}
                      <span>{timeAgo(activity.timestamp, t)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LevelUpModal
        open={levelUpOpen}
        onClose={closeLevelUp}
        oldLevel={oldLevel}
        newLevel={newLevel}
      />
    </div>
  );
}
