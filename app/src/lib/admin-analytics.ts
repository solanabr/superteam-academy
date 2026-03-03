import { prisma } from "@/lib/db";

export interface DailyCount {
  date: string;
  count: number;
}

export interface ActiveUsers {
  dau: number;
  wau: number;
  mau: number;
}

export interface EnrollmentFunnel {
  enrolled: number;
  started: number;
  completed: number;
}

export interface EngagementPoint {
  date: string;
  enrollments: number;
  completions: number;
}

export interface RetentionCohort {
  cohortWeek: string;
  cohortSize: number;
  retentionByWeek: number[];
}

export interface TopCourse {
  id: string;
  title: string;
  slug: string;
  enrollments: number;
  completions: number;
  completionRate: number;
}

export interface PlatformSummary {
  totalUsers: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalXP: number;
  totalAchievementsClaimed: number;
  avgCompletionRate: number;
}

export interface AdminAnalyticsData {
  userGrowth: DailyCount[];
  activeUsers: ActiveUsers;
  enrollmentFunnel: EnrollmentFunnel;
  engagement: EngagementPoint[];
  retention: RetentionCohort[];
  topCourses: TopCourse[];
  summary: PlatformSummary;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weeksAgo(weeks: number): Date {
  return daysAgo(weeks * 7);
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function rangeInDays(range: string): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return 365 * 5;
    default:
      return 30;
  }
}

export async function getUserGrowth(range: string): Promise<DailyCount[]> {
  const days = rangeInDays(range);
  const since = daysAgo(days);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, number>();
  for (const u of users) {
    const key = formatDate(u.createdAt);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  const result: DailyCount[] = [];
  const cursor = new Date(since);
  const now = new Date();
  while (cursor <= now) {
    const key = formatDate(cursor);
    result.push({ date: key, count: grouped.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function getActiveUsers(): Promise<ActiveUsers> {
  const now = new Date();
  const dayAgo = daysAgo(1);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const [dau, wau, mau] = await Promise.all([
    prisma.activity.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: dayAgo, lte: now } },
    }),
    prisma.activity.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: weekAgo, lte: now } },
    }),
    prisma.activity.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: monthAgo, lte: now } },
    }),
  ]);

  return { dau: dau.length, wau: wau.length, mau: mau.length };
}

export async function getEnrollmentFunnel(): Promise<EnrollmentFunnel> {
  const [enrolled, withCompletions, completed] = await Promise.all([
    prisma.enrollment.count(),
    prisma.enrollment.count({
      where: { completions: { some: {} } },
    }),
    prisma.enrollment.count({
      where: { completedAt: { not: null } },
    }),
  ]);

  return { enrolled, started: withCompletions, completed };
}

export async function getEngagementOverTime(
  range: string,
): Promise<EngagementPoint[]> {
  const days = rangeInDays(range);
  const since = daysAgo(days);

  const [enrollments, completions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { enrolledAt: { gte: since } },
      select: { enrolledAt: true },
    }),
    prisma.enrollment.findMany({
      where: { completedAt: { gte: since, not: null } },
      select: { completedAt: true },
    }),
  ]);

  const enrollMap = new Map<string, number>();
  for (const e of enrollments) {
    const key = formatDate(e.enrolledAt);
    enrollMap.set(key, (enrollMap.get(key) ?? 0) + 1);
  }

  const completeMap = new Map<string, number>();
  for (const c of completions) {
    if (c.completedAt) {
      const key = formatDate(c.completedAt);
      completeMap.set(key, (completeMap.get(key) ?? 0) + 1);
    }
  }

  const result: EngagementPoint[] = [];
  const cursor = new Date(since);
  const now = new Date();
  while (cursor <= now) {
    const key = formatDate(cursor);
    result.push({
      date: key,
      enrollments: enrollMap.get(key) ?? 0,
      completions: completeMap.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function getRetentionCohorts(
  weeks: number = 8,
): Promise<RetentionCohort[]> {
  const cohorts: RetentionCohort[] = [];

  for (let w = weeks; w >= 1; w--) {
    const cohortStart = weeksAgo(w);
    const cohortEnd = weeksAgo(w - 1);

    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: cohortStart, lt: cohortEnd },
      },
      select: { id: true },
    });

    if (cohortUsers.length === 0) {
      cohorts.push({
        cohortWeek: formatDate(cohortStart),
        cohortSize: 0,
        retentionByWeek: [],
      });
      continue;
    }

    const userIds = cohortUsers.map((u) => u.id);
    const retentionByWeek: number[] = [];

    for (let week = 0; week < w; week++) {
      const weekStart = new Date(cohortEnd);
      weekStart.setDate(weekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (weekStart > new Date()) break;

      const activeInWeek = await prisma.activity.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          createdAt: { gte: weekStart, lt: weekEnd },
        },
      });

      retentionByWeek.push(
        Math.round((activeInWeek.length / userIds.length) * 100),
      );
    }

    cohorts.push({
      cohortWeek: formatDate(cohortStart),
      cohortSize: userIds.length,
      retentionByWeek,
    });
  }

  return cohorts;
}

export async function getTopCourses(limit: number = 10): Promise<TopCourse[]> {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      enrollments: { _count: "desc" },
    },
    take: limit,
  });

  const courseIds = courses.map((c) => c.id);
  const completionCounts = await prisma.enrollment.groupBy({
    by: ["courseId"],
    where: {
      courseId: { in: courseIds },
      completedAt: { not: null },
    },
    _count: { id: true },
  });

  const completionMap = new Map(
    completionCounts.map((c) => [c.courseId, c._count.id]),
  );

  return courses.map((c) => {
    const enrollments = c._count.enrollments;
    const completions = completionMap.get(c.id) ?? 0;
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      enrollments,
      completions,
      completionRate:
        enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
    };
  });
}

export async function getPlatformSummary(): Promise<PlatformSummary> {
  const [
    totalUsers,
    totalEnrollments,
    totalCompletions,
    xpAggregate,
    totalAchievementsClaimed,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.xPEvent.aggregate({ _sum: { amount: true } }),
    prisma.userAchievement.count(),
  ]);

  const avgCompletionRate =
    totalEnrollments > 0
      ? Math.round((totalCompletions / totalEnrollments) * 100)
      : 0;

  return {
    totalUsers,
    totalEnrollments,
    totalCompletions,
    totalXP: xpAggregate._sum.amount ?? 0,
    totalAchievementsClaimed,
    avgCompletionRate,
  };
}

export async function getAdminAnalytics(
  range: string,
): Promise<AdminAnalyticsData> {
  const [
    userGrowth,
    activeUsers,
    enrollmentFunnel,
    engagement,
    retention,
    topCourses,
    summary,
  ] = await Promise.all([
    getUserGrowth(range),
    getActiveUsers(),
    getEnrollmentFunnel(),
    getEngagementOverTime(range),
    getRetentionCohorts(8),
    getTopCourses(10),
    getPlatformSummary(),
  ]);

  return {
    userGrowth,
    activeUsers,
    enrollmentFunnel,
    engagement,
    retention,
    topCourses,
    summary,
  };
}
