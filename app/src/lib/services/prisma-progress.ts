import { prisma } from "@/lib/db";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
} from "@/types";
import type { LearningProgressService } from "./learning-progress";
import { NotificationService } from "./notification-service";
import { getAchievements as getSeedAchievements } from "../../../seeds/data/achievements";

const notifService = new NotificationService();

function toDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export class PrismaProgressService implements LearningProgressService {
  // ── Progress ────────────────────────────────────────────────────────────────

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        completions: true,
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!enrollment) return null;

    const totalLessons = enrollment.course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );
    const completedCount = enrollment.completions.length;

    return {
      courseId,
      completedLessons: enrollment.completions.map((_, i) => i),
      totalLessons,
      percentage:
        totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt?.toISOString(),
      lastAccessedAt: enrollment.lastAccessedAt.toISOString(),
    };
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        completions: true,
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });

    return enrollments.map((enrollment) => {
      const totalLessons = enrollment.course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0,
      );
      const completedCount = enrollment.completions.length;

      return {
        courseId: enrollment.courseId,
        completedLessons: enrollment.completions.map((_, i) => i),
        totalLessons,
        percentage:
          totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString(),
        lastAccessedAt: enrollment.lastAccessedAt.toISOString(),
      };
    });
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                lessons: {
                  orderBy: { order: "asc" },
                  select: { id: true, xpReward: true },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) return;

    // Flatten lessons to find the one at the given index
    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const lesson = allLessons[lessonIndex];
    if (!lesson) return;

    // Upsert completion (idempotent)
    await prisma.lessonCompletion.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        xpEarned: lesson.xpReward,
      },
      update: {},
    });

    // Award XP — snapshot level before/after for level-up notification
    const xpBefore = await this.getXP(userId);
    const prevLevel = levelFromXP(xpBefore);
    const newTotal = await this.addXP(userId, lesson.xpReward);
    const newLevel = levelFromXP(newTotal);
    if (newLevel > prevLevel) {
      notifService
        .createLevelUp(userId, prevLevel, newLevel)
        .catch(() => undefined);
    }

    // Record activity for streak
    await this.recordActivity(userId);

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        type: "lesson_completed",
        data: { courseId, lessonIndex, lessonId: lesson.id },
      },
    });

    // Update enrollment timestamp
    const completionCount = await prisma.lessonCompletion.count({
      where: { enrollmentId: enrollment.id },
    });

    const totalLessons = allLessons.length;
    const isComplete = completionCount >= totalLessons;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        lastAccessedAt: new Date(),
        ...(isComplete && !enrollment.completedAt
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: { lastAccessedAt: new Date() },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: "course_enrolled",
        data: { courseId },
      },
    });
  }

  // ── XP ──────────────────────────────────────────────────────────────────────

  async getXP(userId: string): Promise<number> {
    const result = await prisma.xPEvent.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async addXP(userId: string, amount: number): Promise<number> {
    await prisma.xPEvent.create({
      data: {
        userId,
        amount,
        source: "lesson",
      },
    });
    const newTotal = await this.getXP(userId);
    // Fire-and-forget milestone notification
    notifService
      .maybeCreateXpMilestone(userId, newTotal)
      .catch(() => undefined);
    return newTotal;
  }

  // ── Streaks ─────────────────────────────────────────────────────────────────

  async getStreak(userId: string): Promise<StreakData> {
    const streak = await prisma.streakData.findUnique({
      where: { userId },
      include: { activities: { orderBy: { date: "desc" }, take: 365 } },
    });

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: "",
        streakFreezes: 0,
        activityCalendar: {},
      };
    }

    const calendar: Record<string, boolean> = {};
    for (const a of streak.activities) {
      calendar[toDateKey(a.date)] = a.active;
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate
        ? toDateKey(streak.lastActivityDate)
        : "",
      streakFreezes: streak.streakFreezes,
      activityCalendar: calendar,
    };
  }

  async recordActivity(userId: string): Promise<StreakData> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayKey = toDateKey(today);

    const streak = await prisma.streakData.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      },
      update: {},
    });

    const lastDate = streak.lastActivityDate
      ? toDateKey(streak.lastActivityDate)
      : "";

    if (lastDate === todayKey) {
      return this.getStreak(userId);
    }

    const yesterday = new Date(today.getTime() - 86_400_000);
    const yesterdayKey = toDateKey(yesterday);

    let newCurrent = streak.currentStreak;

    if (lastDate === yesterdayKey) {
      newCurrent += 1;
    } else if (lastDate) {
      const daysSinceLast = Math.floor(
        (today.getTime() - new Date(lastDate).getTime()) / 86_400_000,
      );
      if (daysSinceLast === 2 && streak.streakFreezes > 0) {
        // Use a streak freeze
        newCurrent += 1;
        await prisma.streakData.update({
          where: { userId },
          data: { streakFreezes: { decrement: 1 } },
        });
        // Record yesterday's activity as a freeze day
        await prisma.dailyActivity.upsert({
          where: {
            streakDataId_date: { streakDataId: streak.id, date: yesterday },
          },
          create: { streakDataId: streak.id, date: yesterday, active: true },
          update: {},
        });
      } else {
        newCurrent = 1;
      }
    } else {
      newCurrent = 1;
    }

    const newLongest = Math.max(streak.longestStreak, newCurrent);

    await prisma.streakData.update({
      where: { userId },
      data: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastActivityDate: today,
      },
    });

    // Record today's activity
    await prisma.dailyActivity.upsert({
      where: { streakDataId_date: { streakDataId: streak.id, date: today } },
      create: { streakDataId: streak.id, date: today, active: true },
      update: {},
    });

    return this.getStreak(userId);
  }

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    const now = new Date();
    let since: Date | undefined;

    if (timeframe === "weekly") {
      since = new Date(now.getTime() - 7 * 86_400_000);
    } else if (timeframe === "monthly") {
      since = new Date(now.getTime() - 30 * 86_400_000);
    }

    // Build the XP aggregation query
    const xpByUser = await prisma.xPEvent.groupBy({
      by: ["userId"],
      _sum: { amount: true },
      ...(since ? { where: { createdAt: { gte: since } } } : {}),
      orderBy: { _sum: { amount: "desc" } },
      take: 100,
    });

    // Get user details
    const userIds = xpByUser.map((x) => x.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        displayName: true,
        name: true,
        wallet: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // If filtering by course, get enrolled users
    let enrolledUserIds: Set<string> | null = null;
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      });
      enrolledUserIds = new Set(enrollments.map((e) => e.userId));
    }

    // Get streak data for these users
    const streaks = await prisma.streakData.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, currentStreak: true },
    });
    const streakMap = new Map(streaks.map((s) => [s.userId, s.currentStreak]));

    let entries: LeaderboardEntry[] = xpByUser
      .filter((x) => !enrolledUserIds || enrolledUserIds.has(x.userId))
      .map((x, i) => {
        const user = userMap.get(x.userId);
        const xp = x._sum.amount ?? 0;
        return {
          rank: i + 1,
          wallet: user?.wallet ?? x.userId,
          displayName: user?.displayName ?? user?.name ?? undefined,
          avatar: user?.image ?? undefined,
          xp,
          level: levelFromXP(xp),
          streak: streakMap.get(x.userId) ?? 0,
        };
      });

    // Re-sort and re-rank after filtering
    entries.sort((a, b) => b.xp - a.xp);
    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    return entries;
  }

  // ── Credentials ─────────────────────────────────────────────────────────────

  async getCredentials(wallet: string): Promise<Credential[]> {
    const user = await prisma.user.findUnique({
      where: { wallet },
      select: { id: true },
    });

    if (!user) return [];

    const creds = await prisma.userCredential.findMany({
      where: { userId: user.id },
    });

    return creds.map((c) => ({
      trackId: c.trackId,
      trackName: c.trackName,
      currentLevel: c.currentLevel,
      coursesCompleted: c.coursesCompleted,
      totalXpEarned: c.totalXpEarned,
      firstEarned: c.firstEarned.toISOString(),
      lastUpdated: c.lastUpdated.toISOString(),
      mintAddress: c.mintAddress ?? undefined,
      metadataUri: c.metadataUri ?? undefined,
      badgeImage: c.badgeImage ?? undefined,
    }));
  }

  // ── Achievements ────────────────────────────────────────────────────────────

  async getAchievements(userId: string | null): Promise<Achievement[]> {
    // Always use seed data for achievement definitions — DB may have stale/wrong data
    const seedAchievements = getSeedAchievements();

    const userClaims = userId
      ? await prisma.userAchievement
          .findMany({ where: { userId } })
          .catch(() => [])
      : [];

    const claimMap = new Map(
      userClaims.map((c) => [c.achievementId, c.claimedAt.toISOString()]),
    );

    return seedAchievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category as Achievement["category"],
      xpReward: a.xpReward,
      claimed: claimMap.has(a.id),
      claimedAt: claimMap.get(a.id),
    }));
  }

  async claimAchievement(userId: string, achievementId: number): Promise<void> {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement) return;

    // Check if already claimed
    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    if (existing) return;

    await prisma.$transaction([
      prisma.userAchievement.create({
        data: { userId, achievementId },
      }),
      prisma.xPEvent.create({
        data: {
          userId,
          amount: achievement.xpReward,
          source: "achievement",
          sourceId: String(achievementId),
        },
      }),
      prisma.activity.create({
        data: {
          userId,
          type: "achievement_claimed",
          data: { achievementId, name: achievement.name },
        },
      }),
    ]);

    notifService
      .createAchievementNotification(userId, {
        achievementId,
        achievementName: achievement.name,
        xpReward: achievement.xpReward,
        icon: achievement.icon,
      })
      .catch(() => undefined);
  }
}
