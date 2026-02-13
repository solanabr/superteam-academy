import { PublicKey } from '@solana/web3.js';
import { getCourseLessonTotal } from '@/lib/data/courses';
import {
  Credential,
  LeaderboardEntry,
  Progress,
  StreakData,
  Timeframe
} from '@/lib/types';
import { levelFromXP } from '@/lib/utils';
import { LearningProgressService } from '@/lib/services/learning-progress-service';

const progressStore = new Map<string, Set<number>>();
const enrollmentStore = new Map<string, Set<string>>();
const xpByUser = new Map<string, number>();
const streakByUser = new Map<string, number>();

function keyOf(userId: string, courseId: string): string {
  return `${userId}:${courseId}`;
}

function timeframeMultiplier(timeframe: Timeframe): number {
  if (timeframe === 'alltime') {
    return 1;
  }

  if (timeframe === 'monthly') {
    return 0.62;
  }

  return 0.28;
}

function ensureUser(userId: string): void {
  if (!xpByUser.has(userId)) {
    xpByUser.set(userId, 0);
  }

  if (!streakByUser.has(userId)) {
    streakByUser.set(userId, 0);
  }
}

function compactAddress(value: string): string {
  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export class LocalLearningProgressService implements LearningProgressService {
  async enrollCourse(userId: string, courseId: string): Promise<void> {
    ensureUser(userId);
    const enrollments = enrollmentStore.get(userId) ?? new Set<string>();
    enrollments.add(courseId);
    enrollmentStore.set(userId, enrollments);
  }

  async getEnrollment(userId: string, courseId: string): Promise<boolean> {
    const enrollments = enrollmentStore.get(userId);
    if (!enrollments) {
      return false;
    }

    return enrollments.has(courseId);
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    ensureUser(userId);
    const key = keyOf(userId, courseId);
    const completed = progressStore.get(key) ?? new Set<number>();
    const totalLessons = await getCourseLessonTotal(courseId);
    const percentage = totalLessons === 0 ? 0 : Math.round((completed.size / totalLessons) * 100);

    return {
      userId,
      courseId,
      completedLessonIndexes: [...completed.values()].sort((a, b) => a - b),
      percentage,
      xpEarned: completed.size * 40
    };
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    ensureUser(userId);
    await this.enrollCourse(userId, courseId);

    const key = keyOf(userId, courseId);
    const completed = progressStore.get(key) ?? new Set<number>();

    if (!completed.has(lessonIndex)) {
      completed.add(lessonIndex);
      progressStore.set(key, completed);
      xpByUser.set(userId, (xpByUser.get(userId) ?? 0) + 40);
      streakByUser.set(userId, (streakByUser.get(userId) ?? 0) + 1);
    }
  }

  async getXP(userId: string): Promise<number> {
    ensureUser(userId);
    return xpByUser.get(userId) ?? 0;
  }

  async getStreak(userId: string): Promise<StreakData> {
    ensureUser(userId);

    const current = streakByUser.get(userId) ?? 0;
    const longest = current;
    const today = new Date();
    const activeDates = Array.from({ length: Math.min(current, 30) }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      return date.toISOString().split('T')[0];
    });

    return {
      current,
      longest,
      lastActiveDate: today.toISOString().split('T')[0],
      activeDates
    };
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    const multiplier = timeframeMultiplier(timeframe);

    return [...xpByUser.entries()]
      .map(([userId, xp]) => {
        const adjustedXP = Math.floor(xp * multiplier);
        return {
          userId,
          username: compactAddress(userId),
          avatarUrl: '/avatars/default.png',
          xp: adjustedXP,
          level: levelFromXP(adjustedXP),
          streak: streakByUser.get(userId) ?? 0
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    void wallet;
    return [];
  }
}

export const localLearningProgressService = new LocalLearningProgressService();
