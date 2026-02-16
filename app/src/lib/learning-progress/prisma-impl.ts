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

const LESSON_FLAGS_LEN = 32;

function toUint8Array(b: Buffer | Uint8Array): Uint8Array {
  return b instanceof Uint8Array ? b : new Uint8Array(b);
}

function setLessonFlag(flags: Buffer | Uint8Array, index: number): Buffer {
  const out = Buffer.from(flags);
  const byte = Math.floor(index / 8);
  const bit = index % 8;
  if (byte < out.length) out[byte] |= 1 << bit;
  return out;
}

function countSetBits(flags: Buffer | Uint8Array): number {
  let n = 0;
  for (let i = 0; i < flags.length; i++) {
    for (let b = 0; b < 8; b++) {
      if (flags[i]! & (1 << b)) n++;
    }
  }
  return n;
}

function isLessonComplete(flags: Buffer | Uint8Array, index: number): boolean {
  const byte = Math.floor(index / 8);
  const bit = index % 8;
  return byte < flags.length && (flags[byte]! & (1 << bit)) !== 0;
}

/** UTC day number (seconds since epoch / 86400). Same as SPEC. */
function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

/** Compute new streak and lastActivityDate. No freezes in stub. */
function updateStreakForComplete(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number
): { currentStreak: number; longestStreak: number; lastActivityDate: Date } {
  const now = new Date();
  const today = utcDayNumber(now);
  if (!lastActivityDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), lastActivityDate: now };
  }
  const lastDay = utcDayNumber(lastActivityDate);
  if (today <= lastDay) {
    return { currentStreak, longestStreak, lastActivityDate: lastActivityDate };
  }
  const gap = today - lastDay - 1;
  const newStreak = gap === 0 ? currentStreak + 1 : 1;
  const newLongest = Math.max(longestStreak, newStreak);
  return { currentStreak: newStreak, longestStreak: newLongest, lastActivityDate: now };
}

export function createLearningProgressService(prisma: PrismaClient): LearningProgressService {
  return {
    async getProgress(userId: string): Promise<Progress | null> {
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
    },

    async getEnrollmentProgress(userId: string, courseId: string): Promise<EnrollmentProgress | null> {
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
        completedCount,
        totalLessons: LESSON_FLAGS_LEN * 8,
      };
    },

    async getXP(userId: string): Promise<number> {
      const row = await prisma.progress.findUnique({ where: { userId }, select: { xp: true } });
      return row?.xp ?? 0;
    },

    async getStreak(userId: string): Promise<StreakData> {
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
    },

    async getLeaderboard(options?: { limit?: number }): Promise<LeaderboardEntry[]> {
      const limit = options?.limit ?? 50;
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
    },

    async getCredentials(userId: string): Promise<Credential[]> {
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
    },

    async completeLesson(params: {
      userId: string;
      courseId: string;
      lessonIndex: number;
      xpReward: number;
    }): Promise<void> {
      const { userId, courseId, lessonIndex, xpReward } = params;
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!enrollment) throw new Error("Enrollment not found");
      if (isLessonComplete(enrollment.lessonFlags, lessonIndex)) {
        return;
      }

      const newFlags = setLessonFlag(enrollment.lessonFlags, lessonIndex);
      const progressRow = await prisma.progress.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
      });
      const { currentStreak, longestStreak, lastActivityDate } = updateStreakForComplete(
        progressRow?.lastActivityDate ?? null,
        progressRow?.currentStreak ?? 0,
        progressRow?.longestStreak ?? 0
      );

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
          },
          update: {
            xp: { increment: xpReward },
            currentStreak,
            longestStreak,
            lastActivityDate,
          },
        }),
      ]);
    },

    async enroll(userId: string, courseId: string): Promise<void> {
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
    },
  };
}
