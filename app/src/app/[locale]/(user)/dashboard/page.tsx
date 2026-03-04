"use client";

import { useTranslations } from "next-intl";
import { useAPIQuery } from "@/lib/api/useAPI";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@/i18n/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type ProfileXp = {
  total_xp: number;
  level: number;
};

type ProfileStreak = {
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_at: string | null;
};

type Profile = {
  user_id: string;
  email: string;
  role: string;
  wallet_public_key: string | null;
  xp: ProfileXp;
  streak: ProfileStreak;
  achievement_count: number;
  leaderboard_rank: number | null;
};

type LeaderboardEntry = {
  user_id: string;
  wallet_public_key: string;
  email: string | null;
  total_xp: number;
};

type AchievementItem = {
  achievement_id: string;
  name: string | null;
  image_url?: string | null;
  xp_reward: number | null;
  awarded_at: string | null;
};

const AWARD_IMAGE_FALLBACK = "/award.webp";

type EnrollmentItem = {
  course_slug: string;
  course_title: string;
  completed: number;
  total: number;
  next_lesson_slug: string | null;
};

function levelProgress(totalXp: number, level: number): number {
  const nextLevelXp = (level + 1) * (level + 1) * 100;
  const currentLevelFloorXp = level * level * 100;
  const inLevelXp = totalXp - currentLevelFloorXp;
  const inLevelRange = nextLevelXp - currentLevelFloorXp;
  if (inLevelRange <= 0) return 100;
  return Math.max(0, Math.min(100, (inLevelXp / inLevelRange) * 100));
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.is_loaded);

  const { data: profile, isPending: profilePending } = useAPIQuery<Profile>({
    queryKey: ["profile"],
    path: "/api/user/profile",
    enabled: Boolean(session),
  });

  const { data: achievementsData } = useAPIQuery<{ achievements: AchievementItem[] }>({
    queryKey: ["achievements"],
    path: "/api/achievement/user",
    enabled: Boolean(session),
  });

  const { data: leaderboardData } = useAPIQuery<{ entries: LeaderboardEntry[] }>({
    queryKey: ["leaderboard"],
    path: "/api/leaderboard?limit=5&offset=0",
    enabled: Boolean(session),
  });

  const { data: enrollmentsData } = useAPIQuery<{ enrollments: EnrollmentItem[] }>({
    queryKey: ["enrollments"],
    path: "/api/user/enrollments",
    enabled: Boolean(session),
  });

  if (!isLoaded) return null;
  if (!session) return null;

  const isPending = profilePending;
  const totalXp = profile?.xp?.total_xp ?? 0;
  const level = profile?.xp?.level ?? 0;
  const progressPercent = levelProgress(totalXp, level);
  const streak = profile?.streak ?? {
    current_streak_days: 0,
    longest_streak_days: 0,
    last_activity_at: null,
  };
  const leaderboardRank = profile?.leaderboard_rank ?? null;
  const achievementCount = profile?.achievement_count ?? 0;
  const topEntries = leaderboardData?.entries ?? [];
  const top3 = topEntries.slice(0, 3);
  const achievements = achievementsData?.achievements ?? [];
  const lastEarned = achievements.length > 0
    ? achievements.sort(
        (a, b) =>
          new Date(b.awarded_at ?? 0).getTime() -
          new Date(a.awarded_at ?? 0).getTime(),
      )[0]
    : null;
  const recentActivity = achievements
    .sort(
      (a, b) =>
        new Date(b.awarded_at ?? 0).getTime() -
        new Date(a.awarded_at ?? 0).getTime(),
    )
    .slice(0, 5);
  const enrollments = enrollmentsData?.enrollments ?? [];

  const cardClass =
    "rounded-none border-2 border-border bg-card p-5 shadow-[3px_3px_0_0_hsl(var(--foreground)_/_0.15)]";

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      {isPending && <DashboardSkeleton />}
      {!isPending && profile && (
        <>
          <section
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-labelledby="dashboard-metrics"
          >
            <h2 id="dashboard-metrics" className="sr-only">
              {t("title")} metrics
            </h2>

            {/* A. XP & Level */}
            <Card className={cardClass}>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {t("xpProgress")}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-3 space-y-3 p-0">
                <p className="text-2xl font-bold text-foreground">
                  {totalXp} XP
                </p>
                <p className="text-lg font-semibold">{t("level")}: {level}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("progressToNextLevel")}
                  </p>
                  <Progress value={progressPercent} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* B. Streak */}
            <Card className={cardClass}>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {t("streak")}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-3 space-y-1 p-0">
                <p className="text-2xl font-bold text-foreground">
                  {t("streakDays", { count: streak.current_streak_days })}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("longestStreak")}: {streak.longest_streak_days}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("lastActivity")}: {formatDate(streak.last_activity_at)}
                </p>
              </CardContent>
            </Card>

            {/* Leaderboard rank + Wallet or third metric */}
            <Card className={cardClass}>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {t("leaderboardRank")}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-3 space-y-2 p-0">
                <p className="text-2xl font-bold text-foreground">
                  {leaderboardRank != null ? `#${leaderboardRank}` : "—"}
                </p>
                <Link
                  href="/leaderboard"
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {t("viewFullLeaderboard")}
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* C. Leaderboard snapshot */}
          <section aria-labelledby="leaderboard-snapshot">
            <h2 id="leaderboard-snapshot" className="mb-4 text-lg font-bold text-foreground">
              {t("leaderboardRank")}
            </h2>
            <Card className={cardClass}>
              <CardContent className="p-0">
                <ul className="divide-y-2 divide-border">
                  {top3.map((entry, idx) => (
                    <li
                      key={entry.user_id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <span className="font-bold text-foreground">
                        #{idx + 1}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {entry.email ?? entry.user_id.slice(0, 8)}…
                      </span>
                      <span className="text-sm font-semibold">
                        {entry.total_xp} XP
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/leaderboard"
                  className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {t("viewFullLeaderboard")}
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* D. Enrolled courses */}
          <section aria-labelledby="enrolled-courses">
            <h2 id="enrolled-courses" className="mb-4 text-lg font-bold text-foreground">
              {t("enrolledCourses")}
            </h2>
            {enrollments.length === 0 ? (
              <Card className={cardClass}>
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground">
                    {t("emptyActivity")}
                  </p>
                  <Link href="/courses" className="mt-2 inline-block">
                    <Button variant="outline" size="sm" className="rounded-none border-2">
                      {t("continueLearning")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-4">
                {enrollments.map((enrollment) => {
                  const percent =
                    enrollment.total > 0
                      ? Math.round((enrollment.completed / enrollment.total) * 100)
                      : 0;
                  const continueHref =
                    enrollment.next_lesson_slug
                      ? `/courses/${enrollment.course_slug}/lessons/${enrollment.next_lesson_slug}`
                      : `/courses/${enrollment.course_slug}`;
                  return (
                    <li key={enrollment.course_slug}>
                      <Card className={cardClass}>
                        <CardContent className="space-y-3 p-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-bold text-foreground">
                              {enrollment.course_title}
                            </h3>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {percent}%
                            </span>
                          </div>
                          <Progress value={percent} className="h-2" />
                          <Link
                            href={continueHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button
                              variant="default"
                              size="sm"
                              className="rounded-none border-2 border-foreground"
                            >
                              {t("continue")}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* E. Achievements summary */}
          <section aria-labelledby="achievements-summary">
            <h2 id="achievements-summary" className="mb-4 text-lg font-bold text-foreground">
              {t("achievementsSummary")}
            </h2>
            <Card className={cardClass}>
              <CardContent className="flex flex-col gap-2 p-0">
                <p className="text-2xl font-bold text-foreground">
                  {t("totalAchievements")}: {achievementCount}
                </p>
                {lastEarned && (
                  <p className="text-sm text-muted-foreground">
                    {t("lastEarned")}: {lastEarned.name ?? "—"}
                  </p>
                )}
                <Link href="/profile" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                  {t("viewProfile")}
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* F. Recent activity */}
          <section aria-labelledby="recent-activity">
            <h2 id="recent-activity" className="mb-4 text-lg font-bold text-foreground">
              {t("recentActivity")}
            </h2>
            <Card className={cardClass}>
              <CardContent className="p-0">
                {recentActivity.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    {t("emptyActivity")}
                  </p>
                ) : (
                  <ul className="divide-y-2 divide-border">
                    {recentActivity.map((item) => (
                      <li key={item.achievement_id} className="flex items-center gap-3 py-3 first:pt-0">
                        <img
                          src={item.image_url ?? AWARD_IMAGE_FALLBACK}
                          alt=""
                          className="size-10 shrink-0 rounded-none border-2 border-border object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium">
                            {t("achievementAward")}: {item.name ?? "—"}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatDate(item.awarded_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
