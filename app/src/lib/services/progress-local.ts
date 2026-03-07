import { prisma } from "@/lib/db/client";
import { generateCertificatePublicId } from "@/lib/certificates/records";
import { logger } from "@/lib/logging/logger";
import { getContentService } from "@/lib/services/content-factory";
import { getAchievementEngine } from "@/lib/services/achievements";
import type { LearningProgressService } from "./progress";
import type { Progress, CompletionResult, StreakData, LeaderboardEntry } from "@/types/progress";
import type { AchievementCheckContext } from "@/types/achievements";

/**
 * Calculate level from XP
 * Formula: Math.floor(Math.sqrt(totalXP / 100))
 */
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date2 is the day after date1
 */
function isNextDay(date1: Date, date2: Date): boolean {
  const nextDay = new Date(date1);
  nextDay.setDate(nextDay.getDate() + 1);
  return isSameDay(nextDay, date2);
}

function getTimeframeStart(timeframe: "weekly" | "monthly" | "alltime"): Date | null {
  const now = new Date();

  if (timeframe === "weekly") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    return weekStart;
  }

  if (timeframe === "monthly") {
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    return monthStart;
  }

  return null;
}

/**
 * Prisma implementation of LearningProgressService
 */
export class PrismaLearningProgressService implements LearningProgressService {
  /**
   * Enroll a user in a course
   * Creates enrollment and initializes XP/streak records if needed
   */
  async enrollInCourse(userId: string, courseSlug: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Idempotent enrollment under concurrency.
        await tx.enrollment.upsert({
          where: { userId_courseSlug: { userId, courseSlug } },
          update: {},
          create: {
            userId,
            courseSlug,
            enrolledAt: new Date(),
          },
        });

        // Initialize UserXP if not exists
        await tx.userXP.upsert({
          where: { userId },
          create: {
            userId,
            totalXP: 0,
            weeklyXP: 0,
            monthlyXP: 0,
            lastWeeklyReset: new Date(),
            lastMonthlyReset: new Date(),
          },
          update: {},
        });

        // Initialize UserStreak if not exists
        await tx.userStreak.upsert({
          where: { userId },
          create: {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            streakHistory: [],
          },
          update: {},
        });
      });

      logger.info("User enrolled in course", { userId, courseSlug });
    } catch (error) {
      logger.error("Failed to enroll in course", { userId, courseSlug, error });
      throw error;
    }
  }

  /**
   * Get progress for a specific course
   */
  async getProgress(userId: string, courseSlug: string): Promise<Progress | null> {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseSlug: { userId, courseSlug } },
      });

      if (!enrollment) {
        return null;
      }

      const completions = await prisma.lessonCompletion.findMany({
        where: { userId, courseSlug },
        select: { lessonId: true },
      });

      const completedLessons = completions.map((c) => c.lessonId);

      // Get total lessons from course content
      const contentService = getContentService();
      const course = await contentService.getCourse(courseSlug);
      const totalLessons = course
        ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
        : 0;

      return {
        courseSlug,
        completedLessons,
        totalLessons,
        completionPercent: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
      };
    } catch (error) {
      logger.error("Failed to get progress", { userId, courseSlug, error });
      throw error;
    }
  }

  /**
   * Get all progress for a user
   */
  async getAllProgress(userId: string): Promise<Progress[]> {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
      });

      const progressList: Progress[] = [];

      for (const enrollment of enrollments) {
        const completions = await prisma.lessonCompletion.findMany({
          where: { userId, courseSlug: enrollment.courseSlug },
          select: { lessonId: true },
        });

        const completedLessons = completions.map((c) => c.lessonId);

        // Get total lessons from course content
        const contentService = getContentService();
        const course = await contentService.getCourse(enrollment.courseSlug);
        const totalLessons = course
          ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
          : 0;

        progressList.push({
          courseSlug: enrollment.courseSlug,
          completedLessons,
          totalLessons,
          completionPercent: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
        });
      }

      return progressList;
    } catch (error) {
      logger.error("Failed to get all progress", { userId, error });
      throw error;
    }
  }

  /**
   * Complete a lesson and award XP
   * This is the main complex operation with XP calculation, streaks, level ups, and achievements
   */
  async completeLesson(
    userId: string,
    courseSlug: string,
    lessonId: string
  ): Promise<CompletionResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if already completed (idempotent)
        const existingCompletion = await tx.lessonCompletion.findUnique({
          where: {
            userId_courseSlug_lessonId: { userId, courseSlug, lessonId },
          },
        });

        if (existingCompletion) {
          // Return existing result without double XP
          const userXP = await tx.userXP.findUnique({ where: { userId } });
          const totalXP = userXP?.totalXP ?? 0;
          const level = calculateLevel(totalXP);

          return {
            xpAwarded: 0,
            totalXP,
            newLevel: level,
            previousLevel: level,
            leveledUp: false,
            isFirstOfDay: false,
            streakUpdated: false,
            newAchievements: [] as string[],
            isNewCompletion: false,
          };
        }

        // Get lesson XP reward from course content
        const contentService = getContentService();
        const course = await contentService.getCourse(courseSlug);
        const lesson = course ? await contentService.getLesson(courseSlug, lessonId) : null;
        const lessonXP = lesson?.xpReward ?? 50;

        // Get current user data
        const userXP = await tx.userXP.findUnique({ where: { userId } });
        const userStreak = await tx.userStreak.findUnique({ where: { userId } });

        const previousXP = userXP?.totalXP ?? 0;
        const previousLevel = calculateLevel(previousXP);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check if this is the first completion of the day
        const lastCompletion = await tx.lessonCompletion.findFirst({
          where: { userId },
          orderBy: { completedAt: "desc" },
        });

        const isFirstOfDay = !lastCompletion || !isSameDay(lastCompletion.completedAt, now);

        // Calculate bonus XP
        const firstOfDayBonus = isFirstOfDay ? 25 : 0;
        const totalXPAwarded = lessonXP + firstOfDayBonus;

        // Reset weekly/monthly XP if needed
        let weeklyXP = userXP?.weeklyXP ?? 0;
        let monthlyXP = userXP?.monthlyXP ?? 0;
        let lastWeeklyReset = userXP?.lastWeeklyReset ?? now;
        let lastMonthlyReset = userXP?.lastMonthlyReset ?? now;

        const daysSinceWeeklyReset = Math.floor(
          (now.getTime() - new Date(lastWeeklyReset).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysSinceMonthlyReset = Math.floor(
          (now.getTime() - new Date(lastMonthlyReset).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceWeeklyReset >= 7) {
          weeklyXP = 0;
          lastWeeklyReset = now;
        }

        if (daysSinceMonthlyReset >= 30) {
          monthlyXP = 0;
          lastMonthlyReset = now;
        }

        // Update streak
        let currentStreak = userStreak?.currentStreak ?? 0;
        let longestStreak = userStreak?.longestStreak ?? 0;
        const lastActivityDate = userStreak?.lastActivityDate;
        const streakHistory = (userStreak?.streakHistory as string[]) ?? [];
        let streakUpdated = false;

        const lastActivity = lastActivityDate ? new Date(lastActivityDate) : null;

        if (!lastActivity) {
          // First activity
          currentStreak = 1;
          longestStreak = 1;
          streakHistory.push(today.toISOString().split("T")[0]);
          streakUpdated = true;
        } else if (isSameDay(lastActivity, now)) {
          // Already active today - no streak change
        } else if (isNextDay(lastActivity, now)) {
          // Consecutive day - increment streak
          currentStreak += 1;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          streakHistory.push(today.toISOString().split("T")[0]);
          streakUpdated = true;
        } else {
          // Streak broken - reset to 1
          currentStreak = 1;
          streakHistory.push(today.toISOString().split("T")[0]);
          streakUpdated = true;
        }

        // Create lesson completion record
        await tx.lessonCompletion.create({
          data: {
            userId,
            courseSlug,
            lessonId,
            xpAwarded: totalXPAwarded,
            completedAt: now,
          },
        });

        // Update UserXP
        const newTotalXP = previousXP + totalXPAwarded;
        await tx.userXP.upsert({
          where: { userId },
          create: {
            userId,
            totalXP: newTotalXP,
            weeklyXP: totalXPAwarded,
            monthlyXP: totalXPAwarded,
            lastWeeklyReset: now,
            lastMonthlyReset: now,
          },
          update: {
            totalXP: newTotalXP,
            weeklyXP: weeklyXP + totalXPAwarded,
            monthlyXP: monthlyXP + totalXPAwarded,
            lastWeeklyReset,
            lastMonthlyReset,
          },
        });

        // Update UserStreak
        await tx.userStreak.upsert({
          where: { userId },
          create: {
            userId,
            currentStreak,
            longestStreak,
            lastActivityDate: now,
            streakHistory,
          },
          update: {
            currentStreak,
            longestStreak,
            lastActivityDate: now,
            streakHistory,
          },
        });

        // Check if course is now complete
        const allCompletions = await tx.lessonCompletion.findMany({
          where: { userId, courseSlug },
          select: { lessonId: true },
        });

        const completedLessonIds = new Set(allCompletions.map((c) => c.lessonId));
        const totalLessons = course
          ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
          : 0;

        const isCourseComplete = completedLessonIds.size >= totalLessons && totalLessons > 0;

        if (isCourseComplete) {
          // Course complete - award bonus XP
          const lessonXPList = course!.modules.flatMap((m) => m.lessons.map((l) => l.xpReward));
          const totalLessonXP = lessonXPList.reduce((sum, xp) => sum + xp, 0);
          const courseBonusXP = Math.max(500, (course?.totalXP ?? 0) - totalLessonXP);
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
              displayName: true,
              username: true,
              walletAddress: true,
            },
          });

          // Update enrollment as completed
          await tx.enrollment.update({
            where: { userId_courseSlug: { userId, courseSlug } },
            data: { completedAt: now },
          });

          await tx.certificateRecord.upsert({
            where: {
              userId_courseSlug: {
                userId,
                courseSlug,
              },
            },
            update: {},
            create: {
              publicId: generateCertificatePublicId(),
              userId,
              courseSlug,
              courseNameSnapshot: course?.title ?? courseSlug,
              completedAt: now,
              xpEarned: course?.totalXP ?? 0,
              recipientNameSnapshot:
                user?.displayName ?? user?.username ?? "Superteam Academy Learner",
              recipientWalletSnapshot: user?.walletAddress ?? null,
              credentialMintSnapshot: null,
              verificationUrlSnapshot: null,
            },
          });

          // Add course completion bonus XP
          const finalTotalXP = newTotalXP + courseBonusXP;
          await tx.userXP.update({
            where: { userId },
            data: {
              totalXP: finalTotalXP,
              weeklyXP: weeklyXP + totalXPAwarded + courseBonusXP,
              monthlyXP: monthlyXP + totalXPAwarded + courseBonusXP,
            },
          });

          const newLevel = calculateLevel(finalTotalXP);
          return {
            xpAwarded: totalXPAwarded + courseBonusXP,
            totalXP: finalTotalXP,
            newLevel,
            previousLevel,
            leveledUp: newLevel > previousLevel,
            isFirstOfDay,
            streakUpdated,
            newAchievements: [] as string[],
            isNewCompletion: true,
            isCourseComplete,
          };
        }

        const newLevel = calculateLevel(newTotalXP);

        return {
          xpAwarded: totalXPAwarded,
          totalXP: newTotalXP,
          newLevel,
          previousLevel,
          leveledUp: newLevel > previousLevel,
          isFirstOfDay,
          streakUpdated,
          newAchievements: [] as string[],
          isNewCompletion: true,
          isCourseComplete: false,
        };
      });

      // Check for achievements after transaction completes (outside transaction)
      if (result.isNewCompletion) {
        // Get current user stats for achievement check
        const [userXP, userStreak, allCompletions, allEnrollments, unlockedAchievements] = await Promise.all([
          prisma.userXP.findUnique({ where: { userId } }),
          prisma.userStreak.findUnique({ where: { userId } }),
          prisma.lessonCompletion.findMany({ where: { userId } }),
          prisma.enrollment.findMany({ where: { userId } }),
          prisma.userAchievementNew.findMany({
            where: { userId },
            select: { achievementId: true },
          }),
        ]);

        // Count completed courses
        const completedCourses = allEnrollments
          .filter((e) => e.completedAt !== null)
          .map((e) => e.courseSlug);

        // Count challenges completed (lessons with "challenge" type)
        // For now, estimate based on lesson completions
        const totalChallengesCompleted = 0; // Would need lesson type info

        const achievementContext: AchievementCheckContext = {
          userId,
          totalXP: userXP?.totalXP ?? 0,
          level: result.newLevel,
          currentStreak: userStreak?.currentStreak ?? 0,
          longestStreak: userStreak?.longestStreak ?? 0,
          totalLessonsCompleted: allCompletions.length,
          totalCoursesCompleted: completedCourses.length,
          completedCourses,
          totalChallengesCompleted,
          alreadyUnlocked: unlockedAchievements.map((a) => a.achievementId),
        };

        const achievementEngine = getAchievementEngine();
        const newAchievementIds = await achievementEngine.checkAchievements(achievementContext);

        // Update result with new achievements
        result.newAchievements = newAchievementIds;
      }

      return result;
    } catch (error) {
      const prismaCode =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code)
          : null;

      // If a concurrent request inserted the same completion first, treat as idempotent success.
      if (prismaCode === "P2002") {
        const userXP = await prisma.userXP.findUnique({ where: { userId } });
        const totalXP = userXP?.totalXP ?? 0;
        const level = calculateLevel(totalXP);
        return {
          xpAwarded: 0,
          totalXP,
          newLevel: level,
          previousLevel: level,
          leveledUp: false,
          isFirstOfDay: false,
          streakUpdated: false,
          newAchievements: [],
          isNewCompletion: false,
          isCourseComplete: false,
        };
      }

      logger.error("Failed to complete lesson", { userId, courseSlug, lessonId, error });
      throw error;
    }
  }

  /**
   * Check if a lesson has been completed
   */
  async isLessonCompleted(userId: string, courseSlug: string, lessonId: string): Promise<boolean> {
    try {
      const completion = await prisma.lessonCompletion.findUnique({
        where: {
          userId_courseSlug_lessonId: { userId, courseSlug, lessonId },
        },
      });

      return completion !== null;
    } catch (error) {
      logger.error("Failed to check lesson completion", { userId, courseSlug, lessonId, error });
      throw error;
    }
  }

  /**
   * Get user's total XP
   */
  async getXP(userId: string): Promise<number> {
    try {
      const userXP = await prisma.userXP.findUnique({
        where: { userId },
      });

      return userXP?.totalXP ?? 0;
    } catch (error) {
      logger.error("Failed to get XP", { userId, error });
      throw error;
    }
  }

  /**
   * Get user's current level
   */
  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId);
    return calculateLevel(xp);
  }

  /**
   * Get user's streak data
   */
  async getStreak(userId: string): Promise<StreakData> {
    try {
      const userStreak = await prisma.userStreak.findUnique({
        where: { userId },
      });

      if (!userStreak) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakHistory: [],
        };
      }

      return {
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak,
        lastActivityDate: userStreak.lastActivityDate,
        streakHistory: (userStreak.streakHistory as string[]) ?? [],
      };
    } catch (error) {
      logger.error("Failed to get streak", { userId, error });
      throw error;
    }
  }

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    limit = 50,
    courseSlug?: string | null
  ): Promise<LeaderboardEntry[]> {
    try {
      if (courseSlug) {
        const timeframeStart = getTimeframeStart(timeframe);
        const filteredRows = await prisma.lessonCompletion.groupBy({
          by: ["userId"],
          where: {
            courseSlug,
            ...(timeframeStart ? { completedAt: { gte: timeframeStart } } : {}),
          },
          _sum: { xpAwarded: true },
          orderBy: { _sum: { xpAwarded: "desc" } },
          take: limit,
        });

        const userIds = filteredRows.map((row) => row.userId);
        if (userIds.length === 0) {
          return [];
        }

        const [users, streaks, userXPs] = await Promise.all([
          prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          }),
          prisma.userStreak.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, currentStreak: true },
          }),
          prisma.userXP.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, totalXP: true },
          }),
        ]);

        const userMap = new Map(users.map((user) => [user.id, user]));
        const streakMap = new Map(streaks.map((streak) => [streak.userId, streak.currentStreak]));
        const xpMap = new Map(userXPs.map((xp) => [xp.userId, xp.totalXP]));

        return filteredRows
          .filter((row) => (row._sum.xpAwarded ?? 0) > 0)
          .map((row, index) => {
            const user = userMap.get(row.userId);

            return {
              rank: index + 1,
              userId: row.userId,
              username: user?.displayName ?? user?.username ?? "Anonymous",
              avatarUrl: user?.avatarUrl ?? null,
              totalXP: row._sum.xpAwarded ?? 0,
              level: calculateLevel(xpMap.get(row.userId) ?? 0),
              currentStreak: streakMap.get(row.userId) ?? 0,
            };
          });
      }

      const orderByField =
        timeframe === "weekly" ? "weeklyXP" : timeframe === "monthly" ? "monthlyXP" : "totalXP";

      const userXPs = await prisma.userXP.findMany({
        take: limit,
        orderBy: { [orderByField]: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Fetch streaks separately
      const userIds = userXPs.map((uxp) => uxp.userId);
      const streaks = await prisma.userStreak.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, currentStreak: true },
      });
      const streakMap = new Map(streaks.map((s) => [s.userId, s.currentStreak]));

      return userXPs.map((uxp, index) => ({
        rank: index + 1,
        userId: uxp.user.id,
        username: uxp.user.displayName ?? uxp.user.username ?? "Anonymous",
        avatarUrl: uxp.user.avatarUrl,
        totalXP: uxp.totalXP,
        level: calculateLevel(uxp.totalXP),
        currentStreak: streakMap.get(uxp.userId) ?? 0,
      }));
    } catch (error) {
      logger.error("Failed to get leaderboard", { timeframe, limit, error });
      throw error;
    }
  }

  /**
   * Get user's rank in the leaderboard
   */
  async getUserRank(
    userId: string,
    timeframe: "weekly" | "monthly" | "alltime",
    courseSlug?: string | null
  ): Promise<number> {
    try {
      if (courseSlug) {
        const timeframeStart = getTimeframeStart(timeframe);
        const rows = await prisma.lessonCompletion.groupBy({
          by: ["userId"],
          where: {
            courseSlug,
            ...(timeframeStart ? { completedAt: { gte: timeframeStart } } : {}),
          },
          _sum: { xpAwarded: true },
          orderBy: { _sum: { xpAwarded: "desc" } },
        });

        const rank = rows.findIndex((row) => row.userId === userId);
        return rank >= 0 ? rank + 1 : 0;
      }

      const orderByField =
        timeframe === "weekly" ? "weeklyXP" : timeframe === "monthly" ? "monthlyXP" : "totalXP";

      const userXP = await prisma.userXP.findUnique({
        where: { userId },
      });

      if (!userXP) {
        return 0;
      }

      const userValue =
        orderByField === "weeklyXP"
          ? userXP.weeklyXP
          : orderByField === "monthlyXP"
            ? userXP.monthlyXP
            : userXP.totalXP;

      const higherRankedCount = await prisma.userXP.count({
        where: {
          [orderByField]: { gt: userValue },
        },
      });

      return higherRankedCount + 1;
    } catch (error) {
      logger.error("Failed to get user rank", { userId, timeframe, error });
      throw error;
    }
  }

  /**
   * Get user's XP history
   * Returns empty array for now - will be implemented with XPEvent model
   */
  async getXPHistory(): Promise<import("@/types").XPEvent[]> {
    // TODO: Implement XP history tracking with XPEvent model
    // This is a placeholder that returns empty array to satisfy the interface
    return [];
  }

  /**
   * Get user's achievements
   * Returns empty array for now - will be implemented with UserAchievement model
   */
  async getAchievements(): Promise<import("@/types").Achievement[]> {
    // TODO: Implement achievements tracking with UserAchievement model
    // This is a placeholder that returns empty array to satisfy the interface
    return [];
  }

  /**
   * Unlock an achievement for a user
   * Placeholder implementation
   */
  async unlockAchievement(): Promise<void> {
    // TODO: Implement achievement unlocking with UserAchievement model
    // This is a placeholder that does nothing to satisfy the interface
  }
}
