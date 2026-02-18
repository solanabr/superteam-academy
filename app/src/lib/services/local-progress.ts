/**
 * Local/mock implementation of LearningProgressService.
 * Uses localStorage for persistence. Swap with on-chain implementation later.
 */

import { PublicKey } from '@solana/web3.js';
import type {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from './interfaces';
import { calculateLevel } from './interfaces';

const STORAGE_PREFIX = 'stacademy_';

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'alice', displayName: 'Alice.sol', xp: 4200, level: 6, streak: 14 },
  { rank: 2, userId: 'bob', displayName: 'Bob DeFi', xp: 3800, level: 6, streak: 7 },
  { rank: 3, userId: 'carlos', displayName: 'Carlos Dev', xp: 3100, level: 5, streak: 21 },
  { rank: 4, userId: 'diana', displayName: 'Diana.eth', xp: 2500, level: 5, streak: 3 },
  { rank: 5, userId: 'eduardo', displayName: 'Eduardo Chain', xp: 1900, level: 4, streak: 10 },
  { rank: 6, userId: 'fernanda', displayName: 'Fernanda NFT', xp: 1600, level: 4, streak: 5 },
  { rank: 7, userId: 'gustavo', displayName: 'Gustavo Anchor', xp: 1200, level: 3, streak: 8 },
  { rank: 8, userId: 'helena', displayName: 'Helena Rust', xp: 900, level: 3, streak: 2 },
  { rank: 9, userId: 'igor', displayName: 'Igor Web3', xp: 500, level: 2, streak: 1 },
  { rank: 10, userId: 'julia', displayName: 'Julia Solana', xp: 200, level: 1, streak: 4 },
];

export class LocalProgressService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const key = `progress_${userId}_${courseId}`;
    return getStorage<Progress>(key, {
      courseId,
      userId,
      completedLessons: [],
      totalLessons: 10,
      percentComplete: 0,
      lastAccessedAt: new Date(),
      enrolledAt: new Date(),
    });
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    return getStorage<Progress[]>(`all_progress_${userId}`, []);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const progress = await this.getProgress(userId, courseId);
    if (!progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons.push(lessonIndex);
      progress.percentComplete = (progress.completedLessons.length / progress.totalLessons) * 100;
      progress.lastAccessedAt = new Date();
      setStorage(`progress_${userId}_${courseId}`, progress);

      // Award XP
      const currentXP = await this.getXP(userId);
      const xpGain = 25; // base lesson XP
      setStorage(`xp_${userId}`, currentXP + xpGain);

      // Update streak
      await this._updateStreak(userId);
    }
  }

  async getXP(userId: string): Promise<number> {
    return getStorage<number>(`xp_${userId}`, 0);
  }

  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId);
    return calculateLevel(xp);
  }

  async getStreak(userId: string): Promise<StreakData> {
    return getStorage<StreakData>(`streak_${userId}`, {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      streakHistory: [],
      streakFreezes: 0,
    });
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    // In production, this would index XP token balances via Helius DAS API
    return MOCK_LEADERBOARD;
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    // In production, reads cNFTs from wallet via Metaplex Bubblegum
    return getStorage<Credential[]>(`credentials_${wallet.toBase58()}`, []);
  }

  private async _updateStreak(userId: string): Promise<void> {
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().split('T')[0];

    if (streak.lastActivityDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streak.lastActivityDate === yesterday) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastActivityDate = today;
    if (!streak.streakHistory.includes(today)) {
      streak.streakHistory.push(today);
    }

    setStorage(`streak_${userId}`, streak);

    // Streak bonus XP
    if (streak.currentStreak > 0) {
      const currentXP = await this.getXP(userId);
      setStorage(`xp_${userId}`, currentXP + 10);
    }
  }
}
