"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { LinkWalletPrompt } from "@/components/auth";
import { OnboardingModal } from "@/components/onboarding";
import { XPDisplay, StreakBadge } from "@/components/shared";
import {
  StreakCalendar,
  LevelRing,
  AchievementMintList,
} from "@/components/gamification";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllProgress,
  useXP,
  useStreak,
  useActivities,
} from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import {
  BookOpen,
  ArrowRight,
  Zap,
  Trophy,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { profile, isLoading: authLoading } = useAuth();
  const { progressList, loading: progressLoading } = useAllProgress();
  const { balance, loading: xpLoading } = useXP();
  const { streak } = useStreak();
  const { activities } = useActivities(10);

  // Only show onboarding when profile is loaded AND onboarding is incomplete
  // Don't show while auth is still loading (profile is null during loading)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = !onboardingDismissed && !authLoading && !!profile && !profile.onboardingCompleted;

  const handleOnboardingChange = useCallback((open: boolean) => {
    if (!open) setOnboardingDismissed(true);
  }, []);

  const inProgress = progressList.filter((p) => !p.isCompleted);
  const completed = progressList.filter((p) => p.isCompleted);

  return (
    <ProtectedRoute>
      <PlatformLayout>
        <OnboardingModal open={showOnboarding} onOpenChange={handleOnboardingChange} />
        <LinkWalletPrompt />
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("welcome")}, {profile?.displayName ?? "Learner"} 👋
            </h1>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("title")}
                </span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              {xpLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <XPDisplay xp={balance.amount} showProgress size="lg" />
              )}
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Level</span>
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-3">
                <LevelRing xp={balance.amount} size={48} />
                <div>
                  <p className="text-2xl font-bold">{balance.level}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(balance.progress * 100)}% to next
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Streak</span>
                <StreakBadge streak={streak.currentStreak} />
              </div>
              <p className="text-2xl font-bold">
                {streak.currentStreak} days
              </p>
              <p className="text-xs text-muted-foreground">
                Best: {streak.longestStreak} days
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">
                {inProgress.length} in progress
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Courses + Activity */}
            <div className="lg:col-span-2 space-y-8">
              {/* Current courses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {t("currentCourses")}
                  </h2>
                  <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                    <Link href="/courses">
                      View All <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>

                {progressLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                ) : inProgress.length === 0 ? (
                  <div className="rounded-xl border bg-card p-8 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {t("noCourses")}
                    </p>
                    <Button asChild>
                      <Link href="/courses">{t("startLearning")}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inProgress.map((p) => (
                      <Link
                        key={p.courseId}
                        href={`/courses/${p.courseId}`}
                        className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-all hover:border-primary/20"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Play className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {p.courseId}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={p.completionPercentage}
                              className="h-1.5 flex-1"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {Math.round(p.completionPercentage)}%
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                          <Zap className="h-3 w-3" />
                          {p.xpEarned}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievement NFTs */}
              <AchievementMintList />

              {/* Recent activity */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {t("recentActivity")}
                </h2>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent activity.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{act.title}</span>
                          {act.description && (
                            <span className="text-muted-foreground ml-1">
                              — {act.description}
                            </span>
                          )}
                        </div>
                        {act.xp ? (
                          <span className="text-xs text-amber-600 font-medium shrink-0">
                            +{act.xp} XP
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3 inline mr-0.5" />
                          {new Date(act.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Streak Calendar */}
            <div className="space-y-8">
              <div className="rounded-xl border bg-card p-5">
                <StreakCalendar streakHistory={streak.streakHistory} />
              </div>
            </div>
          </div>
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
