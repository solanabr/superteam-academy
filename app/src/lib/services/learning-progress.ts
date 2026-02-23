import {
  mockCredentials,
  mockLeaderboard,
  mockProfiles,
} from "@/lib/data/mock-courses";
import { XP_PER_LESSON, levelFromXp } from "@/lib/solana/constants";
import type {
  CourseProgress,
  Credential,
  LeaderboardEntry,
  LeaderboardTimeframe,
  StreakData,
} from "@/types";

const progressKey = "academy:progress";
const streakKey = "academy:streak";
const xpKey = "academy:xp";

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T): void => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<CourseProgress>;
  completeLesson(userId: string, courseId: string, lessonId: string): Promise<void>;
  getXpBalance(walletAddress: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: LeaderboardTimeframe,
    limit?: number,
  ): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
}

class LocalLearningProgressService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<CourseProgress> {
    const records = readJson<Record<string, CourseProgress>>(progressKey, {});
    const key = `${userId}:${courseId}`;
    return (
      records[key] ?? {
        userId,
        courseId,
        completedLessonIds: [],
        completionRate: 0,
        updatedAt: new Date().toISOString(),
      }
    );
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<void> {
    const records = readJson<Record<string, CourseProgress>>(progressKey, {});
    const key = `${userId}:${courseId}`;
    const existing =
      records[key] ??
      ({
        userId,
        courseId,
        completedLessonIds: [],
        completionRate: 0,
        updatedAt: new Date().toISOString(),
      } satisfies CourseProgress);

    if (!existing.completedLessonIds.includes(lessonId)) {
      existing.completedLessonIds = [...existing.completedLessonIds, lessonId];
      existing.updatedAt = new Date().toISOString();
      records[key] = existing;
      writeJson(progressKey, records);

      const userXp = readJson<Record<string, number>>(xpKey, {});
      userXp[userId] = (userXp[userId] ?? 0) + XP_PER_LESSON;
      writeJson(xpKey, userXp);

      const streaks = readJson<Record<string, string[]>>(streakKey, {});
      const today = new Date().toISOString().slice(0, 10);
      const days = streaks[userId] ?? [];
      if (!days.includes(today)) {
        streaks[userId] = [...days, today].sort();
      }
      writeJson(streakKey, streaks);
    }
  }

  async getXpBalance(walletAddress: string): Promise<number> {
    const base = mockProfiles.find((profile) => profile.walletAddress === walletAddress)?.xp ?? 0;
    const extra = readJson<Record<string, number>>(xpKey, {});
    return base + (extra[walletAddress] ?? 0);
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const streaks = readJson<Record<string, string[]>>(streakKey, {});
    const rawDays = streaks[userId] ?? [];
    const days = rawDays.map((date) => ({ date, active: true }));

    let currentStreak = 0;
    const sorted = [...rawDays].sort();
    const cursor = new Date();
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const current = cursor.toISOString().slice(0, 10);
      const comparison = sorted[index];
      if (comparison === current) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else if (comparison < current) {
        break;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, 12),
      days,
    };
  }

  async getLeaderboard(
    timeframe: LeaderboardTimeframe,
    limit = 10,
  ): Promise<LeaderboardEntry[]> {
    const multiplier = timeframe === "weekly" ? 1 : timeframe === "monthly" ? 2 : 3;
    return mockLeaderboard
      .map((entry) => ({
        ...entry,
        xp: timeframe === "all-time" ? entry.xp : entry.xp - (3 - multiplier) * 200,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((entry) => ({ ...entry, level: levelFromXp(entry.xp) }));
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    void walletAddress;
    return mockCredentials;
  }
}

export const learningProgressService: LearningProgressService =
  new LocalLearningProgressService();
