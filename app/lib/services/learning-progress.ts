/**
 * LearningProgressService — single interface for progress, XP, leaderboard, credentials, streaks.
 * Stub implementation uses existing API + localStorage; swap for on-chain/backend later.
 * See docs/INTEGRATION.md for account structures and instruction mapping.
 */

import { courses } from '@/lib/data/courses';
import { getStreakData } from './streak';
import type {
  LearningProgress,
  XPBalance,
  Credential,
  LeaderboardEntry,
  LeaderboardTimeframe,
  StreakData,
  EnrollmentResult,
  AchievementReceipt,
} from './types';

const API_BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** Level = floor(sqrt(xp / 100)) per on-chain spec */
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

const ENROLLMENTS_KEY = 'superearn_enrollments';

export interface ILearningProgressService {
  getProgress(wallet: string): Promise<LearningProgress>;
  completeLesson(wallet: string, courseId: string, lessonId: string): Promise<void>;
  getXPBalance(wallet: string): Promise<XPBalance>;
  getStreakData(wallet: string): Promise<StreakData>;
  getLeaderboard(timeframe: LeaderboardTimeframe, courseId?: string): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  getAchievements(wallet: string): Promise<AchievementReceipt[]>;
  enroll(wallet: string, courseId: string): Promise<EnrollmentResult>;
  isEnrolled(wallet: string, courseId: string): Promise<boolean>;
}

async function fetchProgress(wallet: string): Promise<Record<string, string[]>> {
  const res = await fetch(`${API_BASE}/api/progress?wallet=${encodeURIComponent(wallet)}`);
  const data = await res.json();
  return data.completedLessons ?? {};
}

/** Stub: derive XP from local progress (lesson completion). Production: Token-2022 balance. */
function deriveXPFromProgress(completedLessons: Record<string, string[]>): number {
  let xp = 0;
  Object.entries(completedLessons).forEach(([courseId, lessonIds]) => {
    const c = courses.find((x) => x.id === courseId);
    if (c && c.lessons.length) {
      const perLesson = Math.floor(c.xpReward / c.lessons.length);
      xp += lessonIds.length * perLesson;
    }
  });
  return xp;
}

export const learningProgressService: ILearningProgressService = {
  async getProgress(wallet: string): Promise<LearningProgress> {
    const completedLessons = await fetchProgress(wallet);
    const courseProgress = courses.map((c) => {
      const ids = completedLessons[c.id] ?? [];
      const total = c.lessons.length;
      return {
        courseId: c.id,
        completedLessonIds: ids,
        completedCount: ids.length,
        totalLessons: total,
        percent: total ? Math.round((ids.length / total) * 100) : 0,
      };
    });
    return { wallet, completedLessons, courseProgress };
  },

  async completeLesson(wallet: string, courseId: string, lessonId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, courseId, lessonId }),
    });
    if (!res.ok) throw new Error('Failed to complete lesson');
    // Production: backend-signed instruction that sets bit in Enrollment PDA
  },

  async getXPBalance(wallet: string): Promise<XPBalance> {
    const completedLessons = await fetchProgress(wallet);
    const xp = deriveXPFromProgress(completedLessons);
    const level = xpToLevel(xp);
    return { wallet, xp, level };
    // Production: fetch Token-2022 token accounts for XP mint, sum balance
  },

  async getStreakData(wallet: string): Promise<StreakData> {
    if (typeof window === 'undefined') {
      return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
    }
    const key = `lms_streak_${wallet}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
      return JSON.parse(raw) as StreakData;
    } catch {
      return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
    }
  },

  async getLeaderboard(timeframe: LeaderboardTimeframe, courseId?: string): Promise<LeaderboardEntry[]> {
    // Stub: mock data. Production: indexer / Helius DAS aggregation of XP balances; courseId filters by course
    const mock: LeaderboardEntry[] = [
      { rank: 1, wallet: '7xKX...', displayName: 'Builder_42', xp: 650, level: 7, streak: 5 },
      { rank: 2, wallet: '9pQw...', displayName: 'SolanaDev', xp: 520, level: 6, streak: 3 },
      { rank: 3, wallet: '4mNv...', displayName: 'AnchorFan', xp: 400, level: 5, streak: 2 },
    ];
    // When courseId is set, production would filter by course progress; stub returns same list
    return mock;
  },

  async getCredentials(wallet: string): Promise<Credential[]> {
    // Stub: empty or mock. Production: fetch Metaplex Core NFTs for wallet (soulbound credentials)
    return [];
  },

  async getAchievements(wallet: string): Promise<AchievementReceipt[]> {
    // Stub: unlock badges from progress + streak. Production: AchievementReceipt PDAs / soulbound Core NFTs
    const completedLessons = await fetchProgress(wallet);
    const totalCompleted = Object.values(completedLessons).flat().length;
    const streakData = typeof window !== 'undefined' ? getStreakData(wallet) : { currentStreak: 0, longestStreak: 0 };
    const completedPerCourse = courses.map((c) => (completedLessons[c.id] ?? []).length);
    const anyCourseComplete = courses.some((c, i) => c.lessons.length > 0 && completedPerCourse[i] >= c.lessons.length);
    const receipts: AchievementReceipt[] = [];
    const now = new Date().toISOString();
    if (totalCompleted >= 1) {
      receipts.push({ achievementId: 1, name: 'First Steps', xpReward: 25, claimedAt: now });
    }
    if (anyCourseComplete) {
      receipts.push({ achievementId: 2, name: 'Course Completer', xpReward: 200, claimedAt: now });
    }
    if (totalCompleted >= 5) {
      receipts.push({ achievementId: 3, name: 'Speed Runner', xpReward: 50, claimedAt: now });
    }
    if (streakData.currentStreak >= 7 || streakData.longestStreak >= 7) {
      receipts.push({ achievementId: 4, name: 'Week Warrior', xpReward: 75, claimedAt: now });
    }
    if (streakData.longestStreak >= 30) {
      receipts.push({ achievementId: 5, name: 'Monthly Master', xpReward: 150, claimedAt: now });
    }
    return receipts;
  },

  async enroll(wallet: string, courseId: string): Promise<EnrollmentResult> {
    if (typeof window === 'undefined') return { success: true };
    try {
      const key = `${ENROLLMENTS_KEY}_${wallet}`;
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(courseId)) {
        localStorage.setItem(key, JSON.stringify([...list, courseId]));
      }
    } catch {
      // ignore
    }
    return { success: true };
    // Production: build Enroll instruction, wallet signs, send tx
  },

  async isEnrolled(wallet: string, courseId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const key = `${ENROLLMENTS_KEY}_${wallet}`;
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return list.includes(courseId);
    } catch {
      return false;
    }
  },
};
