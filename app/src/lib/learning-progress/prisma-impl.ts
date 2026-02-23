import { PrismaClient } from "@prisma/client";
import type { LearningProgressService } from "./interface";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  EnrollmentProgress,
} from "./types";
import { getLevelFromXp } from "./types";

import {
  toUint8Array,
  setBitFlag as setLessonFlag,
  countSetBits,
  isBitSet as isLessonComplete,
  LESSON_FLAGS_LEN
} from "@/lib/bitmap";

/** UTC day number (seconds since epoch / 86400). Same as SPEC. */
function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

/** 
 * Compute new streak and lastActivityDate. Consumes freezes if needed. 
 * SPEC.md Rule: Each streak freeze covers exactly one missed day.
 */
function calculateNewStreak(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  streakFreezes: number
): { currentStreak: number; longestStreak: number; lastActivityDate: Date; freezesConsumed: number } {
  const now = new Date();
  const today = utcDayNumber(now);
  if (!lastActivityDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), lastActivityDate: now, freezesConsumed: 0 };
  }
  const lastDay = utcDayNumber(lastActivityDate);
  if (today <= lastDay) {
    return { currentStreak, longestStreak, lastActivityDate: lastActivityDate, freezesConsumed: 0 };
  }
  const gap = today - lastDay - 1; // Number of missed days

  if (gap === 0) {
    // Consecutive day
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastActivityDate: now,
      freezesConsumed: 0
    };
  } else if (gap > 0 && streakFreezes >= gap) {
    // Missed days strictly covered by enough freezes
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastActivityDate: now,
      freezesConsumed: gap
    };
  } else {
    // Gap exceeded available freezes - streak is lost
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), lastActivityDate: now, freezesConsumed: 0 };
  }
}

export function createLearningProgressService(prisma: PrismaClient): LearningProgressService {

  const getProgress = async (userId: string): Promise<Progress | null> => {
    const row = await prisma.progress.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      userId: row.userId,
      xp: row.xp,
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActivityDate: row.lastActivityDate,
      achievementFlags: toUint8Array(row.achievementFlags),
    };
  };

  const getEnrollmentProgress = async (userId: string, courseId: string): Promise<EnrollmentProgress | null> => {
    const row = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!row) return null;
    const flags = toUint8Array(row.lessonFlags);
    const completedCount = countSetBits(row.lessonFlags);
    return {
      courseId: row.courseId,
      lessonFlags: flags,
      completedAt: row.completedAt,
      bonusClaimed: row.bonusClaimed,
      completedCount,
      totalLessons: LESSON_FLAGS_LEN * 8,
    };
  };

  const getXP = async (userId: string): Promise<number> => {
    const row = await prisma.progress.findUnique({ where: { userId }, select: { xp: true } });
    return row?.xp ?? 0;
  };

  const getStreak = async (userId: string): Promise<StreakData> => {
    const row = await prisma.progress.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
    });
    if (!row)
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActivityDate: row.lastActivityDate,
    };
  };

  const getLeaderboard = async (options?: { limit?: number; timeframe?: "daily" | "weekly" | "all-time" }): Promise<LeaderboardEntry[]> => {
    const limit = options?.limit ?? 50;
    const timeframe = options?.timeframe ?? "all-time";

    let dateFilter: Date | null = null;
    if (timeframe === "daily") {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0); // Start of today UTC
      dateFilter = d;
    } else if (timeframe === "weekly") {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 7);
      d.setUTCHours(0, 0, 0, 0); // Start of day 7 days ago UTC
      dateFilter = d;
    }

    if (dateFilter) {
      // Group by userId on XpEvent
      const agg = await prisma.xpEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: dateFilter } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: limit,
      });

      if (agg.length === 0) return [];

      // Fetch user wallet, total XP, and currentStreak
      const userIds = agg.map((a: { userId: string, _sum: { amount: number | null } }) => a.userId);
      const rows = await prisma.progress.findMany({
        where: { userId: { in: userIds } },
        include: { user: { select: { walletAddress: true } } },
      });

      // Merge agg and rows
      return agg.map((a: { userId: string, _sum: { amount: number | null } }, i: number) => {
        const r = rows.find(x => x.userId === a.userId);
        const timeframeXp = a._sum.amount ?? 0;
        return {
          rank: i + 1,
          userId: a.userId,
          walletAddress: r?.user?.walletAddress ?? 'Unknown',
          xp: timeframeXp,
          level: r ? getLevelFromXp(r.xp) : getLevelFromXp(timeframeXp), // Level based on true total XP
          currentStreak: r?.currentStreak ?? 0,
        };
      });
    } else {
      // All-time: just use the Progress table which tracks total XP cleanly
      const rows = await prisma.progress.findMany({
        orderBy: { xp: "desc" },
        take: limit,
        include: { user: { select: { walletAddress: true } } },
      });
      return rows.map((row: (typeof rows)[number], i: number) => ({
        rank: i + 1,
        userId: row.userId,
        walletAddress: row.user.walletAddress,
        xp: row.xp,
        level: getLevelFromXp(row.xp),
        currentStreak: row.currentStreak,
      }));
    }
  };

  const getCredentials = async (userId: string): Promise<Credential[]> => {
    const rows = await prisma.credential.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
    });
    return rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      userId: r.userId,
      trackId: r.trackId,
      trackName: r.trackName,
      level: r.level,
      coursesCompleted: r.coursesCompleted,
      totalXpEarned: r.totalXpEarned,
      earnedAt: r.earnedAt,
      metadataUrl: r.metadataUrl,
    }));
  };

  const getCredential = async (id: string): Promise<Credential | null> => {
    const cred = await prisma.credential.findUnique({
      where: { id },
    });
    if (!cred) return null;
    return {
      id: cred.id,
      userId: cred.userId,
      trackId: cred.trackId,
      trackName: cred.trackName,
      level: cred.level,
      coursesCompleted: cred.coursesCompleted,
      totalXpEarned: cred.totalXpEarned,
      earnedAt: cred.earnedAt,
      metadataUrl: cred.metadataUrl,
      // Mock image for DB mode if missing
      image: `/certificates/${cred.trackId}.png`,
    };
  };

  const issueCredential = async (params: {
    userId: string;
    wallet?: string;
    courseId: string;
    trackId: string;
    trackName: string;
    xpEarned: number;
    mintAddress?: string;
    verificationUrl?: string;
  }): Promise<string> => {
    const { userId, wallet, courseId, trackId, trackName, xpEarned, mintAddress, verificationUrl } = params;
    const targetUserId = userId; // Prisma usually uses internal userId, but we could use wallet if needed.

    const existing = await prisma.credential.findFirst({
      where: { userId, trackId },
    });

    if (existing) {
      const newCoursesCount = existing.coursesCompleted + 1;
      const newLevel = Math.min(newCoursesCount, 3);

      await prisma.credential.update({
        where: { id: existing.id },
        data: {
          coursesCompleted: { increment: 1 },
          totalXpEarned: { increment: xpEarned },
          level: newLevel,
          earnedAt: new Date(),
          mintAddress: mintAddress ?? (existing as any).mintAddress,
          verificationUrl: verificationUrl ?? (existing as any).verificationUrl,
        },
      });
      return mintAddress ?? existing.id;
    } else {
      const created = await prisma.credential.create({
        data: {
          userId,
          trackId,
          trackName,
          level: 1,
          coursesCompleted: 1,
          totalXpEarned: xpEarned,
          mintAddress,
          verificationUrl,
        },
      });
      return mintAddress ?? created.id;
    }
  };

  const claimAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
    // 1. Fetch user progress and preferences
    let progress = await prisma.progress.findUnique({
      where: { userId },
      include: { user: { select: { preferences: true } } }
    });

    if (!progress) {
      // Auto-create progress if it doesn't exist (e.g. they unlock easter egg before their first course)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      });
      if (!user) throw new Error("User not found");

      progress = await prisma.progress.create({
        data: {
          userId,
          xp: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievementFlags: Buffer.alloc(32)
        },
        include: { user: { select: { preferences: true } } }
      });
    }

    // 2. Fetch Achievement definition
    const { ACHIEVEMENTS } = await import("@/lib/achievements");
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) throw new Error("Achievement definition not found");
    const bitIndex = achievement.bitIndex;

    // 3. Check if already claimed
    const flags = toUint8Array(progress.achievementFlags);
    if (isLessonComplete(flags, bitIndex)) {
      throw new Error("Achievement already claimed");
    }

    // 4. Validate requirements
    let isValid = false;
    switch (achievementId) {

      case "first-lesson": {
        const enrollments = await prisma.enrollment.findMany({ where: { userId } });
        isValid = enrollments.some(e => countSetBits(e.lessonFlags) > 0);
        if (!isValid) throw new Error("Complete your first lesson to claim this achievement!");
        break;
      }
      case "first-course": {
        const completedCourse = await prisma.enrollment.findFirst({
          where: { userId, completedAt: { not: null } }
        });
        isValid = !!completedCourse;
        if (!isValid) throw new Error("Complete a full course to claim this achievement!");
        break;
      }
      case "streak-3":
        isValid = progress.currentStreak >= 3;
        if (!isValid) throw new Error("Maintain a 3-day streak to claim this achievement!");
        break;
      case "streak-7":
        isValid = progress.currentStreak >= 7;
        if (!isValid) throw new Error("Maintain a 7-day streak to claim this achievement!");
        break;
      case "early-bird": {
        const hours = new Date().getUTCHours();
        isValid = hours < 8;
        if (!isValid) throw new Error("Complete a lesson before 8 AM UTC to claim this achievement!");
        break;
      }
      case "night-owl": {
        const hours = new Date().getUTCHours();
        isValid = hours >= 22;
        if (!isValid) throw new Error("Complete a lesson after 10 PM UTC to claim this achievement!");
        break;
      }
      case "easter-egg": {
        const unlocked = (progress.user.preferences as any)?.unlockedAchievements || [];
        isValid = Array.isArray(unlocked) && unlocked.includes("easter-egg");
        if (!isValid) throw new Error("Easter egg not found yet! Keep searching the platform.");
        break;
      }
      default:
        throw new Error("Unknown achievement");
    }

    if (!isValid) return false;

    // 5. Update progress
    const newFlags = setLessonFlag(flags, bitIndex);

    await prisma.progress.update({
      where: { userId },
      data: {
        achievementFlags: Buffer.from(newFlags),
      },
    });

    return true;
  };

  const enroll = async (userId: string, courseId: string): Promise<void> => {
    const emptyFlags = Buffer.alloc(LESSON_FLAGS_LEN);
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        lessonFlags: emptyFlags,
      },
      update: {},
    });
    await prisma.progress.upsert({
      where: { userId },
      create: {
        userId,
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementFlags: Buffer.alloc(32),
      },
      update: {},
    });
  };

  const completeLesson = async (params: {
    userId: string;
    courseId: string;
    lessonIndex: number;
    xpReward: number;
  }): Promise<void> => {
    const { userId, courseId, lessonIndex, xpReward } = params;
    let enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      // Auto-enroll if not encountered (Frappe LMS best practice: frictionless learning)
      await enroll(userId, courseId);
      enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!enrollment) throw new Error("Failed to auto-enroll user");
    }
    if (isLessonComplete(enrollment.lessonFlags, lessonIndex)) {
      return;
    }

    const newFlags = setLessonFlag(enrollment.lessonFlags, lessonIndex);
    const progressRow = await prisma.progress.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true
      },
    });
    const { currentStreak, longestStreak, lastActivityDate, freezesConsumed } = calculateNewStreak(
      progressRow?.lastActivityDate ?? null,
      progressRow?.currentStreak ?? 0,
      progressRow?.longestStreak ?? 0,
      progressRow?.streakFreezes ?? 0
    );

    const updateData: import("@prisma/client").Prisma.ProgressUpdateInput = {
      xp: { increment: xpReward },
      currentStreak,
      longestStreak,
      lastActivityDate,
    };

    if (freezesConsumed > 0) {
      updateData.streakFreezes = { decrement: freezesConsumed };
      updateData.lastFreezeDate = new Date();
    }

    await prisma.$transaction([
      prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { lessonFlags: Buffer.from(newFlags) },
      }),
      prisma.progress.upsert({
        where: { userId },
        create: {
          userId,
          xp: xpReward,
          currentStreak,
          longestStreak,
          lastActivityDate,
          achievementFlags: Buffer.alloc(32),
          streakFreezes: 1,
        },
        update: updateData,
      }),
      prisma.xpEvent.create({
        data: {
          userId,
          amount: xpReward,
          source: "lesson",
        }
      })
    ]);

    // Achievements are claimed manually by the user from the achievements page.
    // This prevents confetti from firing automatically during lesson completion.
  };

  const finalizeCourse = async (userId: string, courseId: string, lessonCount: number): Promise<void> => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.completedAt) return; // Already finalized

    const flags = toUint8Array(enrollment.lessonFlags);
    const completedCount = countSetBits(flags);

    // Verify all lessons are complete
    if (completedCount < lessonCount) {
      throw new Error(`Cannot finalize: only ${completedCount}/${lessonCount} lessons complete`);
    }

    await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { completedAt: new Date() },
    });

    // Issue credential
    try {
      await issueCredential({
        userId,
        courseId,
        trackId: courseId,
        trackName: courseId,
        xpEarned: 0
      });
      // Achievement "first-course" is claimed manually by the user.
    } catch (e) {
      console.error("Failed to issue credential:", e);
    }
  };

  const claimCompletionBonus = async (userId: string, courseId: string, xpAmount: number): Promise<void> => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    if (!enrollment.completedAt) throw new Error("Course not completed");
    if (enrollment.bonusClaimed) throw new Error("Bonus already claimed");

    await prisma.$transaction([
      prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { bonusClaimed: true },
      }),
      prisma.progress.update({
        where: { userId },
        data: { xp: { increment: xpAmount } },
      }),
      prisma.xpEvent.create({
        data: {
          userId,
          amount: xpAmount,
          source: "course_bonus"
        }
      })
    ]);
  };

  const logActivity = async (userId: string): Promise<void> => {
    const progressRow = await prisma.progress.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true
      },
    });

    if (!progressRow) {
      // Create their initial progress and grant day 1 streak automatically
      await prisma.progress.create({
        data: {
          userId,
          xp: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
          achievementFlags: Buffer.alloc(32)
        }
      });
      return;
    }

    const { currentStreak, longestStreak, lastActivityDate, freezesConsumed } = calculateNewStreak(
      progressRow.lastActivityDate,
      progressRow.currentStreak,
      progressRow.longestStreak,
      progressRow.streakFreezes
    );

    // Only hit DB if there's an actual change in state
    const today = utcDayNumber(new Date());
    const rowLastDay = progressRow.lastActivityDate ? utcDayNumber(progressRow.lastActivityDate) : -1;

    if (today > rowLastDay || freezesConsumed > 0) {
      const updateData: import("@prisma/client").Prisma.ProgressUpdateInput = {
        currentStreak,
        longestStreak,
        lastActivityDate,
      };

      if (freezesConsumed > 0) {
        updateData.streakFreezes = { decrement: freezesConsumed };
        updateData.lastFreezeDate = new Date();
      }

      await prisma.progress.update({
        where: { userId },
        data: updateData,
      });
    }
  };

  return {
    getProgress,
    getEnrollmentProgress,
    getXP,
    getStreak,
    getLeaderboard,
    getCredentials,
    getCredential,
    completeLesson,
    enroll,
    finalizeCourse,
    claimCompletionBonus,
    issueCredential,
    claimAchievement,
    logActivity,
  };
}
