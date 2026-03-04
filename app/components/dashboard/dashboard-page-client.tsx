"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useSolanaClient,
  useWallet,
} from "@solana/connector/react";
import { type Address, unwrapOption } from "@solana/kit";
import { fetchMaybeEnrollment } from "@superteam/academy-sdk";
import {
  CalendarBlank,
  Certificate,
  Fire,
  Medal,
  Sparkle,
  Star,
  TrendUp,
} from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import {
  getAchievements,
  getLeaderboard,
  type Achievement,
} from "@/lib/api/academy";
import { getEnrollmentPda } from "@/lib/academy/pdas";
import { getCompletedLessonIndices } from "@/lib/academy/lesson-bitmap";
import { useXpBalance } from "@/lib/hooks/use-xp-balance";
import type { Course } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardPageClientProps = {
  activeCourses: Course[];
};

type EnrolledCourseProgress = {
  course: Course;
  completedLessons: number;
  completionPercent: number;
  nextLesson: string | null;
  enrolledAt: bigint;
  completedAt: bigint | null;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  timestampMs: number;
};

function formatDateTime(valueMs: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valueMs));
}

function timestampSecondsToMs(value: number | bigint): number {
  return Number(value) * 1000;
}

function nextLessonTitle(
  course: Course,
  completedSet: Set<number>
): string | null {
  let flatIndex = 0;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!completedSet.has(flatIndex)) {
        return lesson.title;
      }
      flatIndex += 1;
    }
  }
  return null;
}

function createMockStreakCalendar(): Array<{
  dateKey: string;
  active: boolean;
}> {
  const today = new Date();
  const activeOffsets = new Set([
    0, 1, 2, 4, 5, 8, 10, 13, 16, 17, 20, 22, 24, 29, 32,
  ]);
  return Array.from({ length: 35 }, (_, idx) => {
    const daysAgo = 34 - idx;
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    const dateKey = d.toISOString().slice(0, 10);
    return { dateKey, active: activeOffsets.has(daysAgo) };
  });
}

function currentStreakFromCalendar(
  days: Array<{ dateKey: string; active: boolean }>
): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (!days[i].active) break;
    streak += 1;
  }
  return streak;
}

export function DashboardPageClient({
  activeCourses,
}: DashboardPageClientProps) {
  const { isConnected } = useWallet();
  const { address } = useAccount();
  const { client, ready } = useSolanaClient();
  const { xp, loading: xpLoading } = useXpBalance();

  const [enrolledCourses, setEnrolledCourses] = useState<
    EnrolledCourseProgress[]
  >([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!isConnected || !address || !ready || !client) {
      setEnrolledCourses([]);
      setRank(null);
      setAchievements([]);
      return;
    }

    setLoadingEnrollments(true);
    setLoadingMeta(true);
    try {
      const enrollmentRows = await Promise.all(
        activeCourses.map(
          async (course): Promise<EnrolledCourseProgress | null> => {
            const enrollmentPda = await getEnrollmentPda(
              course.id,
              address as Address
            );
            const maybeEnrollment = await fetchMaybeEnrollment(
              client.rpc,
              enrollmentPda
            );
            if (!maybeEnrollment.exists) return null;

            const completed = getCompletedLessonIndices(
              maybeEnrollment.data.lessonFlags,
              course.totalLessons
            );
            const completedSet = new Set(completed);
            const completionPercent =
              course.totalLessons > 0
                ? Math.round((completed.length / course.totalLessons) * 100)
                : 0;

            return {
              course,
              completedLessons: completed.length,
              completionPercent,
              nextLesson: nextLessonTitle(course, completedSet),
              enrolledAt: maybeEnrollment.data.enrolledAt,
              completedAt: unwrapOption(maybeEnrollment.data.completedAt, null),
            };
          }
        )
      );

      const onlyEnrolled = enrollmentRows.filter(
        (row): row is EnrolledCourseProgress => row !== null
      );

      onlyEnrolled.sort((a, b) => Number(b.enrolledAt - a.enrolledAt));
      setEnrolledCourses(onlyEnrolled);
      setLoadingEnrollments(false);

      const [leaderboardEntries, achievementRows] = await Promise.all([
        getLeaderboard(),
        getAchievements(address),
      ]);

      const myEntry = leaderboardEntries.find(
        (entry) => entry.wallet === address
      );
      setRank(myEntry?.rank ?? null);
      setAchievements(
        achievementRows.sort((a, b) => b.awardedAt - a.awardedAt)
      );
    } catch (error) {
      console.error("Failed to load dashboard", error);
      setEnrolledCourses([]);
      setRank(null);
      setAchievements([]);
    } finally {
      setLoadingEnrollments(false);
      setLoadingMeta(false);
    }
  }, [activeCourses, address, client, isConnected, ready]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const level = Math.floor(xp / 500) + 1;
  const levelFloor = (level - 1) * 500;
  const levelCeiling = level * 500;
  const levelProgress =
    xp > 0 ? ((xp - levelFloor) / (levelCeiling - levelFloor)) * 100 : 0;

  const streakCalendar = useMemo(() => createMockStreakCalendar(), []);
  const currentStreak = useMemo(
    () => currentStreakFromCalendar(streakCalendar),
    [streakCalendar]
  );

  const recommendedCourses = useMemo(() => {
    const enrolledIds = new Set(enrolledCourses.map((c) => c.course.id));
    return activeCourses
      .filter((course) => !enrolledIds.has(course.id))
      .sort((a, b) => b.xpReward - a.xpReward)
      .slice(0, 3);
  }, [activeCourses, enrolledCourses]);

  const activityFeed = useMemo(() => {
    const enrollmentActivities: ActivityItem[] = enrolledCourses.flatMap(
      (row) => {
        const items: ActivityItem[] = [
          {
            id: `enrolled-${row.course.id}`,
            title: `Enrolled in ${row.course.title}`,
            subtitle: `${row.completedLessons}/${row.course.totalLessons} lessons completed`,
            timestampMs: timestampSecondsToMs(row.enrolledAt),
          },
        ];
        if (row.completedAt !== null) {
          items.push({
            id: `completed-${row.course.id}`,
            title: `Completed ${row.course.title}`,
            subtitle: "Course completed on-chain",
            timestampMs: timestampSecondsToMs(row.completedAt),
          });
        }
        return items;
      }
    );

    const achievementActivities: ActivityItem[] = achievements.map((a) => ({
      id: `achievement-${a.asset}`,
      title: `Achievement unlocked: ${a.name}`,
      subtitle: "Awarded as an on-chain badge",
      timestampMs: timestampSecondsToMs(a.awardedAt),
    }));

    return [...enrollmentActivities, ...achievementActivities]
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, 8);
  }, [achievements, enrolledCourses]);

  if (!isConnected || !address) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Connect your wallet to view your on-chain learning progress.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Track your XP, course progress, streak, and recent on-chain activity.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkle size={18} />
              XP and Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {xpLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">XP Balance</p>
                    <p className="font-mono text-3xl font-semibold">{xp}</p>
                  </div>
                  <Badge variant="secondary">Level {level}</Badge>
                </div>
                <Progress value={levelProgress} />
                <p className="text-xs text-muted-foreground">
                  {Math.max(levelCeiling - xp, 0)} XP to reach Level {level + 1}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal size={18} />
              Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMeta ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <p className="font-mono text-3xl font-semibold">
                  {rank !== null ? `#${rank}` : "Unranked"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on global leaderboard XP standings.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendUp size={18} />
              Current Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEnrollments ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : enrolledCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are not enrolled in any courses yet.
              </p>
            ) : (
              enrolledCourses.map((row) => (
                <div
                  key={row.course.id}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{row.course.title}</p>
                    <Badge variant="outline">{row.completionPercent}%</Badge>
                  </div>
                  <Progress value={row.completionPercent} />
                  <p className="text-xs text-muted-foreground">
                    Next lesson: {row.nextLesson ?? "Course completed"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fire size={18} />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-2xl font-semibold">
                {currentStreak} days
              </p>
              <Badge variant="secondary">Mocked calendar</Badge>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {streakCalendar.map((day) => (
                <div
                  key={day.dateKey}
                  title={day.dateKey}
                  className={
                    day.active
                      ? "h-4 rounded-sm bg-primary/80"
                      : "h-4 rounded-sm bg-muted"
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Certificate size={18} />
              Recent Achievements and Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMeta ? (
              <Skeleton className="h-28 w-full" />
            ) : achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No achievements yet. Complete lessons and courses to unlock
                badges.
              </p>
            ) : (
              achievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.asset}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(
                        timestampSecondsToMs(achievement.awardedAt)
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">Badge</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star size={18} />
              Recommended Next Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are enrolled in all available active courses.
              </p>
            ) : (
              recommendedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.totalLessons} lessons • {course.xpReward} XP
                    </p>
                  </div>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarBlank size={18} />
              Recent Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity yet.
              </p>
            ) : (
              activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.timestampMs)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
