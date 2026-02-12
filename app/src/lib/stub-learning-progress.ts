/**
 * Stub implementation of LearningProgressService.
 * Uses in-memory / localStorage for MVP. Replace with on-chain + indexer later.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import type { LearningProgressService } from './learning-progress-service';
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  LeaderboardTimeframe,
} from './types';

const STORAGE_PREFIX = 'superteam-academy';

function getStoredProgress(userId: string, courseId: string): Progress | null {
  if (typeof window === 'undefined') return null;
  const key = `${STORAGE_PREFIX}:progress:${userId}:${courseId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Progress;
  } catch {
    return null;
  }
}

function setStoredProgress(
  userId: string,
  courseId: string,
  progress: Progress
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}:progress:${userId}:${courseId}`;
  localStorage.setItem(key, JSON.stringify(progress));
}

function getStoredXP(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const key = `${STORAGE_PREFIX}:xp:${userId}`;
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function setStoredXP(userId: string, xp: number): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}:xp:${userId}`;
  localStorage.setItem(key, String(xp));
}

function getStoredStreak(userId: string): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakFreezes: 0 };
  }
  const key = `${STORAGE_PREFIX}:streak:${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakFreezes: 0 };
  try {
    return JSON.parse(raw) as StreakData;
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakFreezes: 0 };
  }
}

function setStoredStreak(userId: string, data: StreakData): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}:streak:${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getEnrolled(userId: string, courseId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${STORAGE_PREFIX}:enrolled:${userId}:${courseId}`) === '1';
}

export function setEnrolled(userId: string, courseId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}:enrolled:${userId}:${courseId}`, '1');
}

function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function createStubLearningProgressService(
  _connection?: Connection
): LearningProgressService {
  return {
    async getProgress(userId: string, courseId: string): Promise<Progress> {
      const stored = getStoredProgress(userId, courseId);
      if (stored) return stored;
      return {
        courseId,
        lessonFlags: [0, 0, 0, 0],
        completedLessons: 0,
        totalLessons: 0,
        completedAt: null,
      };
    },

    async completeLesson(
      userId: string,
      courseId: string,
      lessonIndex: number
    ): Promise<void> {
      const progress = await this.getProgress(userId, courseId);
      const word = Math.floor(lessonIndex / 64);
      const bit = lessonIndex % 64;
      const flags = [...(progress.lessonFlags || [0, 0, 0, 0])];
      while (flags.length <= word) flags.push(0);
      if ((flags[word]! & (1 << bit)) !== 0) return;
      flags[word] = flags[word]! | (1 << bit);
      const completedLessons = flags.reduce((s, f) => s + countBits(f), 0);
      const totalLessons = Math.max(progress.totalLessons, completedLessons);
      const streak = getStoredStreak(userId);
      const now = Date.now();
      const today = Math.floor(now / 86400000);
      const lastDay = streak.lastActivityDate
        ? Math.floor(streak.lastActivityDate / 86400000)
        : -1;
      let currentStreak = streak.currentStreak;
      let longestStreak = streak.longestStreak;
      if (today > lastDay) {
        if (lastDay === -1 || today === lastDay + 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }
      setStoredStreak(userId, {
        currentStreak,
        longestStreak,
        lastActivityDate: now,
        streakFreezes: streak.streakFreezes,
      });
      const xp = getStoredXP(userId);
      const lessonXP = 10 + Math.min(40, lessonIndex * 2);
      setStoredXP(userId, xp + lessonXP);
      setStoredProgress(userId, courseId, {
        courseId,
        lessonFlags: flags,
        completedLessons,
        totalLessons,
        completedAt: totalLessons >= totalLessons ? now : null,
      });
    },

    async getXP(userId: string): Promise<number> {
      return getStoredXP(userId);
    },

    async getStreak(userId: string): Promise<StreakData> {
      return getStoredStreak(userId);
    },

    async getLeaderboard(
      _timeframe: LeaderboardTimeframe
    ): Promise<LeaderboardEntry[]> {
      if (typeof window === 'undefined') return [];
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(`${STORAGE_PREFIX}:xp:`)) {
          keys.push(k);
        }
      }
      const entries: LeaderboardEntry[] = [];
      for (const k of keys) {
        const userId = k.replace(`${STORAGE_PREFIX}:xp:`, '');
        const raw = localStorage.getItem(k);
        const xp = raw ? parseInt(raw, 10) || 0 : 0;
        if (xp > 0) {
          entries.push({
            rank: 0,
            userId,
            wallet: userId,
            displayName: userId.slice(0, 8) + '…',
            xp,
            level: levelFromXP(xp),
            streak: 0,
          });
        }
      }
      entries.sort((a, b) => b.xp - a.xp);
      entries.forEach((e, i) => {
        e.rank = i + 1;
      });
      return entries.slice(0, 100);
    },

    async getCredentials(wallet: PublicKey): Promise<Credential[]> {
      const addr = wallet.toBase58();
      if (typeof window === 'undefined') return [];
      const key = `${STORAGE_PREFIX}:credentials:${addr}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      try {
        return JSON.parse(raw) as Credential[];
      } catch {
        return [];
      }
    },
  };
}

function countBits(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
}
