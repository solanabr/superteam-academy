import "server-only";
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
  /**
   * Internal helper to resolve a userId (which might be a wallet address) to a UUID.
   */
  const resolveId = async (id: string): Promise<string> => {
    // If it looks like a wallet address (Solana addresses are base58, typically 32-44 chars)
    if (id.length >= 32 && id.length <= 44 && !id.includes("-")) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: id },
        select: { id: true },
      });
      return user?.id ?? id;
    }
    return id;
  };

  const getProgress = async (userId: string): Promise<Progress | null> => {
    const resolvedId = await resolveId(userId);
    const row = await prisma.progress.findUnique({ where: { userId: resolvedId } });
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
    const resolvedId = await resolveId(userId);
    const row = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: resolvedId, courseId } },
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
      totalLessons: 0, // Signal to caller to resolve via Sanity or metadata
    };
  };

  const getXP = async (userId: string): Promise<number> => {
    const resolvedId = await resolveId(userId);
    const row = await prisma.progress.findUnique({ where: { userId: resolvedId }, select: { xp: true } });
    return row?.xp ?? 0;
  };

  const getStreak = async (userId: string): Promise<StreakData> => {
    const resolvedId = await resolveId(userId);
    const row = await prisma.progress.findUnique({
      where: { userId: resolvedId },
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

  const getLeaderboard = async (options?: { limit?: number; page?: number; timeframe?: "daily" | "weekly" | "all-time"; courseId?: string }): Promise<LeaderboardEntry[]> => {
    const limit = options?.limit ?? 50;
    const page = options?.page ?? 1;
    const skip = Math.max(0, (page - 1) * limit);
    const timeframe = options?.timeframe ?? "all-time";
    const courseId = options?.courseId;

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

    // Include ALL real XP sources: lessons, quizzes, achievements, graduation, and course bonuses
    const where: any = {
      OR: [
        { source: { startsWith: "lesson:" } },
        { source: { startsWith: "quiz:" } },
        { source: { startsWith: "bonus:" } },
        { source: { startsWith: "achievement:" } },
        { source: { startsWith: "course_bonus" } },
        { source: "graduation" },
      ]
    };
    if (dateFilter) where.createdAt = { gte: dateFilter };
    if (courseId) {
      // If filtering by course, match real sources for that specific course
      where.AND = [
        { source: { contains: courseId } },
        {
          OR: [
            { source: { startsWith: "lesson:" } },
            { source: { startsWith: "quiz:" } },
            { source: { startsWith: "bonus:" } },
          ]
        }
      ];
      delete where.OR; // Clean up the top-level OR as it's now in AND
    }

    if (dateFilter || courseId) {
      // Group by userId on XpEvent
      const agg = await prisma.xpEvent.groupBy({
        by: ['userId'],
        where,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: limit,
        skip: skip,
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
          rank: skip + i + 1,
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
        skip: skip,
        include: { user: { select: { walletAddress: true } } },
      });
      return rows.map((row: (typeof rows)[number], i: number) => ({
        rank: skip + i + 1,
        userId: row.userId,
        walletAddress: row.user.walletAddress,
        xp: row.xp,
        level: getLevelFromXp(row.xp),
        currentStreak: row.currentStreak,
      }));
    }
  };

  const getCredentials = async (userId: string, options?: { limit?: number; skip?: number }): Promise<Credential[]> => {
    const rows = await prisma.credential.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
      take: options?.limit,
      skip: options?.skip,
    });
    return rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      userId: r.userId,
      courseId: r.courseId,
      courseName: r.courseName,
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
    // Try by Prisma DB id first, then fallback to mintAddress (on-chain NFT asset)
    let cred = await prisma.credential.findUnique({
      where: { id },
      include: { user: { select: { walletAddress: true } } }
    });

    if (!cred) {
      // Fallback: look up by mintAddress (the on-chain NFT asset address)
      cred = await prisma.credential.findFirst({
        where: { mintAddress: id },
        include: { user: { select: { walletAddress: true } } }
      });
    }

    if (!cred) return null;
    return {
      id: cred.id,
      userId: cred.userId,
      walletAddress: cred.user.walletAddress,
      courseId: cred.courseId,
      courseName: cred.courseName,
      trackId: cred.trackId,
      trackName: cred.trackName,
      level: cred.level,
      coursesCompleted: cred.coursesCompleted,
      totalXpEarned: cred.totalXpEarned,
      earnedAt: cred.earnedAt,
      metadataUrl: cred.metadataUrl,
      mintAddress: cred.mintAddress,
      verificationUrl: cred.verificationUrl,
      // Mock image for DB mode if missing
      image: `/certificates/${cred.trackId}.png`,
    };
  };

  const issueCredential = async (params: {
    userId: string;
    wallet?: string;
    courseId: string;
    courseName?: string;
    trackId: string;
    trackName: string;
    xpEarned: number;
    mintAddress?: string;
    verificationUrl?: string;
  }): Promise<string> => {
    const { userId, wallet, courseId, courseName, trackId, trackName, xpEarned, mintAddress, verificationUrl } = params;
    const resolvedId = await resolveId(userId);

    // Check for existing credential for THIS COURSE
    const existing = await prisma.credential.findFirst({
      where: { userId: resolvedId, courseId },
    });

    if (existing) {
      // Already has a credential for this course, just update stats if needed
      await prisma.credential.update({
        where: { id: existing.id },
        data: {
          totalXpEarned: { increment: xpEarned },
          earnedAt: new Date(),
          mintAddress: mintAddress ?? (existing as any).mintAddress,
          verificationUrl: verificationUrl ?? (existing as any).verificationUrl,
        },
      });
      return mintAddress ?? existing.id;
    } else {
      // Create NEW credential for this COURSE
      const created = await prisma.credential.create({
        data: {
          userId: resolvedId,
          courseId,
          courseName,
          trackId,
          trackName,
          level: 1, // Course-specific credentials start at level 1
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
    const resolvedId = await resolveId(userId);
    // 1. Fetch user progress and preferences
    let progress = await prisma.progress.findUnique({
      where: { userId: resolvedId },
      include: { user: { select: { preferences: true } } }
    });

    if (!progress) {
      // Auto-create progress if it doesn't exist (e.g. they unlock easter egg before their first course)
      const user = await prisma.user.findUnique({
        where: { id: resolvedId },
        select: { preferences: true }
      });
      if (!user) throw new Error("User not found");

      progress = await prisma.progress.create({
        data: {
          userId: resolvedId,
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
        const enrollments = await prisma.enrollment.findMany({ where: { userId: resolvedId } });
        isValid = enrollments.some(e => countSetBits(e.lessonFlags) > 0);
        if (!isValid) throw new Error("Complete your first lesson to claim this achievement!");
        break;
      }
      case "first-course": {
        const completedCourse = await prisma.enrollment.findFirst({
          where: { userId: resolvedId, completedAt: { not: null } }
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
        errorIds: ["Unknown achievement"];
        throw new Error("Unknown achievement");
    }

    if (!isValid) return false;

    // 5. Update progress with achievement flag + XP (50 per achievement, matching on-chain mint)
    const achievementXp = 50;
    const newFlags = setLessonFlag(flags, bitIndex);

    await prisma.$transaction([
      prisma.progress.update({
        where: { userId: resolvedId },
        data: {
          achievementFlags: Buffer.from(newFlags),
          xp: { increment: achievementXp },
        },
      }),
      prisma.xpEvent.create({
        data: {
          userId: resolvedId,
          amount: achievementXp,
          source: `achievement:${achievementId}`,
        }
      })
    ]);

    return true;
  };

  const enroll = async (userId: string, courseId: string): Promise<void> => {
    const resolvedId = await resolveId(userId);
    const emptyFlags = Buffer.alloc(LESSON_FLAGS_LEN);
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: resolvedId, courseId } },
      create: {
        userId: resolvedId,
        courseId,
        lessonFlags: emptyFlags,
      },
      update: {},
    });
    await prisma.progress.upsert({
      where: { userId: resolvedId },
      create: {
        userId: resolvedId,
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementFlags: Buffer.alloc(32),
      },
      update: {},
    });
  };

  const unenroll = async (userId: string, courseId: string): Promise<void> => {
    await prisma.enrollment.deleteMany({
      where: { userId, courseId },
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
          source: `lesson:${courseId}`,
        }
      })
    ]);

    // Achievements are claimed manually by the user from the achievements page.
    // This prevents confetti from firing automatically during lesson completion.
  };

  const completeQuiz = async (params: {
    userId: string;
    courseId: string;
    moduleId: string;
    quizId: string;
    xpReward: number;
  }): Promise<void> => {
    const { userId, quizId, xpReward } = params;

    // Deduplicate XP event:
    const existing = await prisma.xpEvent.findFirst({
      where: { userId, source: `quiz:${quizId}` }
    });

    if (existing) {
      return; // Already completed
    }

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
          source: `quiz:${quizId}`,
        }
      })
    ]);
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

  const logActivity = async (userId: string): Promise<boolean> => {
    const resolvedId = await resolveId(userId);
    const progressRow = await prisma.progress.findUnique({
      where: { userId: resolvedId },
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
          userId: resolvedId,
          xp: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
          achievementFlags: Buffer.alloc(32)
        }
      });
      return true;
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
        where: { userId: resolvedId },
        data: updateData,
      });
      return true;
    }
    return false;
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
    unenroll,
    finalizeCourse,
    claimCompletionBonus,
    issueCredential,
    claimAchievement,
    logActivity,
    completeQuiz,
  };
}
