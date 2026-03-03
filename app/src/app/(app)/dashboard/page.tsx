"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePrivy } from "@privy-io/react-auth";
import { Flame, BookOpen, Zap, ChevronRight, Award } from "lucide-react";
import { formatXP, xpProgress, getUserDisplayName } from "@/lib/utils";
import { useCourses } from "@/lib/hooks/use-courses";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useDifficulties } from "@/lib/hooks/use-difficulties";
import { difficultyStyle } from "@/lib/utils";
import { AchievementIcon, ActivityCalendar } from "@/components/gamification";
import { DailyGoalCard } from "@/components/gamification/daily-goal";
import { DailyQuestsCard } from "@/components/gamification/daily-quests";
import { StreakDangerBanner } from "@/components/gamification/streak-danger-banner";
import { StreakFreezeCard } from "@/components/gamification/streak-freeze-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EmptyCoursesIllustration,
  EmptyAchievementsIllustration,
} from "@/components/icons";
import {
  DashboardPageSkeleton,
  ActivityFeed,
  SeasonalEventBanner,
  DailyChallengePreview,
} from "@/components/dashboard";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { useTracks } from "@/lib/hooks/use-tracks";

interface UserOnboardingData {
  skillLevel?: string | null;
  onboardingData?: {
    experience?: string;
    interests?: string[];
    goal?: string;
    pace?: string;
  } | null;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { authenticated } = usePrivy();
  const { courses: allCourses } = useCourses();
  const tracks = useTracks();
  const difficulties = useDifficulties();
  const {
    xp,
    streak,
    achievements,
    enrolledCourseIds,
    progressMap,
    isLoaded,
    isOnChain,
  } = useLearningProgress();

  const [onboarding, setOnboarding] = useState<UserOnboardingData>({});

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setOnboarding({
            skillLevel: data.skillLevel,
            onboardingData: data.onboardingData,
          });
        }
      })
      .catch(() => {});
  }, [authenticated]);

  const progress = xpProgress(xp);

  const completedCourseIds = Object.entries(progressMap)
    .filter(([, p]) => p.percentage === 100)
    .map(([id]) => id);

  const enrolledCourseData = allCourses.filter(
    (c) =>
      enrolledCourseIds.includes(c.slug) || enrolledCourseIds.includes(c.id),
  );

  const claimedAchievements = achievements.filter((a) => a.claimed);
  const recentAchievements = claimedAchievements.slice(0, 6);

  const allEnrolledAndCompleted = [...enrolledCourseIds, ...completedCourseIds];

  const recommendedCourses = getPersonalizedRecommendations(allCourses, {
    skillLevel: onboarding.skillLevel,
    preferences: onboarding.onboardingData,
    enrolledIds: allEnrolledAndCompleted,
    tracks,
  });

  if (!isLoaded) {
    return <DashboardPageSkeleton />;
  }

  const displayName = getUserDisplayName();
  const skillLevel = onboarding.skillLevel;
  const skillDiff = skillLevel
    ? difficulties.find((d) => d.value === skillLevel)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Seasonal Event Banner */}
      <SeasonalEventBanner />

      {/* Streak Danger Banner */}
      <StreakDangerBanner />

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("welcome", { name: displayName })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {streak.currentStreak > 0 ? t("subtitle") : t("noStreak")}
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* XP Card */}
        <Link href="/leaderboard" className="glass rounded-xl p-6 transition-all hover:border-st-green/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalXP")}
              </p>
              <p className="mt-1 text-3xl font-bold text-xp">
                {formatXP(xp)} XP
                {isOnChain && (
                  <span
                    className="ml-2 inline-block rounded-full bg-green-500/15 px-2 py-0.5 align-middle text-xs font-medium text-green-600 dark:text-green-400"
                    title="Verified on Solana devnet"
                  >
                    on-chain
                  </span>
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-xp/10">
              <Zap className="h-6 w-6 text-xp" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-level font-medium">
                {t("level", { number: progress.level })}
              </span>
              <span className="text-muted-foreground">
                {formatXP(xp - progress.currentLevelXp)} /{" "}
                {formatXP(progress.nextLevelXp - progress.currentLevelXp)} XP
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-st-green to-brazil-teal transition-all duration-500"
                style={{ width: `${Math.min(progress.progress, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(progress.progress)}% to Level {progress.level + 1}
            </p>
          </div>
        </Link>

        {/* Skill Level Badge (if assessed) */}
        {skillDiff && (
          <Link href="/profile" className="glass rounded-xl p-6 transition-all hover:border-st-green/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("skillLevelLabel")}
                </p>
                <p
                  className="mt-1 inline-flex rounded-full border px-3 py-1 text-lg font-bold"
                  style={{
                    backgroundColor: `${skillDiff.color}18`,
                    color: skillDiff.color,
                    borderColor: `${skillDiff.color}50`,
                  }}
                >
                  {skillDiff.label}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Link>
        )}

        {/* Streak Card */}
        <Link href="/profile" className="glass rounded-xl p-6 transition-all hover:border-st-green/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("streak")}
              </p>
              <p className="mt-1 text-3xl font-bold text-streak">
                {t("streakDays", { count: streak.currentStreak })}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-streak/10">
              <Flame className="h-6 w-6 animate-flame text-streak" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("longestStreak")}:{" "}
            {t("streakDays", { count: streak.longestStreak })}
          </p>

          {/* Calendar Heat Map */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("calendar")}
            </p>
            <ActivityCalendar activityCalendar={streak.activityCalendar} />
          </div>
          <StreakFreezeCard freezes={streak.streakFreezes} />
        </Link>

        {/* Daily Goal Card */}
        <DailyGoalCard />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Activity Feed, Quests, Achievements (2/3 width) */}
        <div className="space-y-8 lg:col-span-2">
          <ActivityFeed limit={20} />

          {/* Daily Quests */}
          <DailyQuestsCard />

          {/* Recent Achievements */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("achievements")}</h2>
              <Link
                href="/profile"
                className="flex items-center gap-1 text-sm text-st-green hover:text-st-green-light transition-colors"
              >
                {tc("all")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {recentAchievements.length === 0 ? (
              <div className="glass rounded-xl">
                <EmptyState
                  illustration={
                    <EmptyAchievementsIllustration className="h-full w-full" />
                  }
                  title={t("achievementsEmpty")}
                  description={t("achievementsEmptyHint")}
                  compact
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {recentAchievements.map((achievement) => (
                  <Link
                    key={achievement.id}
                    href="/profile"
                    className="glass flex flex-col items-center rounded-xl p-3 text-center transition-all hover:border-st-green/30"
                    title={achievement.description}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-achievement/10 text-achievement">
                      <AchievementIcon name={achievement.icon} />
                    </div>
                    <p className="mt-2 text-xs font-medium leading-tight">
                      {achievement.name}
                    </p>
                    <p className="mt-0.5 text-xs text-xp">
                      +{achievement.xpReward} XP
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Courses, Challenge, Getting Started */}
        <div className="space-y-8">
          {/* Active Courses */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("currentCourses")}</h2>
              <Link
                href="/courses"
                className="flex items-center gap-1 text-sm text-st-green hover:text-st-green-light transition-colors"
              >
                {tc("viewAll")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {enrolledCourseData.length === 0 ? (
              <div className="glass rounded-xl">
                <EmptyState
                  illustration={
                    <EmptyCoursesIllustration className="h-full w-full" />
                  }
                  title={t("noCourses")}
                  action={{ label: t("startLearning"), href: "/courses" }}
                  compact
                />
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourseData.map((course) => {
                  const courseProgress =
                    progressMap[course.slug] || progressMap[course.id];
                  const pct = courseProgress?.percentage ?? 0;
                  const isCompleted = pct === 100;
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="glass group flex items-center gap-4 rounded-xl p-4 transition-all hover:border-st-green/30"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        <BookOpen className="h-6 w-6 text-st-green" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold group-hover:text-st-green transition-colors">
                            {course.title}
                          </h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={difficultyStyle(
                              difficulties.find((d) => d.value === course.difficulty)?.color ?? "#888",
                            )}
                          >
                            {difficulties.find((d) => d.value === course.difficulty)?.label ?? course.difficulty}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{course.duration}</span>
                          <span>{course.lessonCount} lessons</span>
                          <span className="text-xp">
                            {formatXP(course.xpTotal)} XP
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? "bg-brazil-green"
                                  : "bg-gradient-to-r from-st-green to-brazil-teal"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isCompleted
                                ? "text-brazil-green"
                                : "text-muted-foreground"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-st-green transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Daily Coding Challenge */}
          <DailyChallengePreview
            headingLabel={t("dailyChallenge")}
            solveLabel={t("solveChallenge")}
            completedLabel={t("challengeCompleted")}
            xpLabel="XP"
          />

          {/* Getting Started */}
          {enrolledCourseIds.length === 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">
                {t("gettingStarted.title")}
              </h2>
              <div className="glass rounded-xl p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="h-4 w-4 text-st-green" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t("gettingStarted.enrollTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("gettingStarted.enrollDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <Zap className="h-4 w-4 text-xp" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t("gettingStarted.xpTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("gettingStarted.xpDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <Flame className="h-4 w-4 text-streak" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t("gettingStarted.streakTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("gettingStarted.streakDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Recommended Courses — full-width below grid */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("recommended")}</h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm text-st-green hover:text-st-green-light transition-colors"
          >
            {tc("viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="glass group rounded-xl p-4 transition-all hover:border-st-green/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-5 w-5 text-brazil-teal" />
              </div>
              <h3 className="font-semibold group-hover:text-st-green transition-colors">
                {course.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {course.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={difficultyStyle(
                    difficulties.find((d) => d.value === course.difficulty)?.color ?? "#888",
                  )}
                >
                  {difficulties.find((d) => d.value === course.difficulty)?.label ?? course.difficulty}
                </span>
                <span className="text-xs text-xp">
                  {formatXP(course.xpTotal)} XP
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
