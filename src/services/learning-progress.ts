import { PublicKey } from '@solana/web3.js';
import {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from '@/types';
import { MOCK_PROGRESS, MOCK_LEADERBOARD, MOCK_GAMIFICATION_PROFILE } from './mock-data';

/**
 * Local/Stubbed implementation of the LearningProgressService.
 * Uses localStorage for persistence. Designed to be swapped with
 * on-chain implementation when the Anchor program is connected.
 */
export class LocalLearningProgressService implements LearningProgressService {
  private getStorageKey(key: string): string {
    return `solana-quest:${key}`;
  }

  private getFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const key = `progress:${userId}:${courseId}`;
    const stored = this.getFromStorage<Progress | null>(key, null);
    if (stored) return stored;

    // Fall back to mock data
    return MOCK_PROGRESS[courseId] || {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      completedLessons: [],
      totalLessons: 10,
      currentModule: 0,
      currentLesson: 0,
      xpEarned: 0,
      completionPercentage: 0,
    };
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const progress = await this.getProgress(userId, courseId);
    if (!progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons.push(lessonIndex);
      progress.completionPercentage = Math.round(
        (progress.completedLessons.length / progress.totalLessons) * 100
      );

      // Update current position
      progress.currentLesson = lessonIndex + 1;

      // Check if course is complete
      if (progress.completedLessons.length >= progress.totalLessons) {
        progress.completedAt = new Date().toISOString();
      }

      const key = `progress:${userId}:${courseId}`;
      this.setToStorage(key, progress);

      // Update streak
      await this.updateStreak(userId);

      // Update XP
      const currentXP = await this.getXP(userId);
      this.setToStorage(`xp:${userId}`, currentXP + 25); // Base XP per lesson
    }
  }

  async getXP(userId: string): Promise<number> {
    return this.getFromStorage<number>(`xp:${userId}`, MOCK_GAMIFICATION_PROFILE.xp);
  }

  async getStreak(userId: string): Promise<StreakData> {
    return this.getFromStorage<StreakData>(
      `streak:${userId}`,
      MOCK_GAMIFICATION_PROFILE.streak
    );
  }

  private async updateStreak(userId: string): Promise<void> {
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = streak.lastActivityDate?.split('T')[0];

    if (lastActivity === today) return; // Already active today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActivity === yesterdayStr) {
      // Continuing streak
      streak.currentStreak += 1;
    } else {
      // Streak broken (unless freeze available)
      if (!streak.hasFreezeAvailable) {
        streak.currentStreak = 1;
      } else {
        streak.currentStreak += 1;
        streak.hasFreezeAvailable = false;
      }
    }

    streak.lastActivityDate = new Date().toISOString();
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.streakHistory = [today, ...streak.streakHistory.slice(0, 364)];

    this.setToStorage(`streak:${userId}`, streak);
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    // In production, this would query the Helius DAS API for XP token balances
    return MOCK_LEADERBOARD;
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    // In production, this would query compressed NFTs from the wallet
    // using the Helius DAS API or Metaplex Read API
    return [
      {
        mintAddress: '5xot9PVkphiX2adznghwrAuxGs2zeWisNSxMW6hU6Hkj',
        track: 'solana-fundamentals',
        level: 3,
        coursesCompleted: 1,
        totalXP: 1500,
        metadata: {
          name: 'Solana Quest: Fundamentals Track',
          description: 'Credential proving completion of the Solana Fundamentals track',
          image: '/images/credentials/fundamentals.png',
          attributes: [
            { trait_type: 'Track', value: 'Solana Fundamentals' },
            { trait_type: 'Level', value: 3 },
            { trait_type: 'XP', value: 1500 },
          ],
        },
        verificationUrl: 'https://explorer.solana.com/address/5xot9PVkphiX2adznghwrAuxGs2zeWisNSxMW6hU6Hkj?cluster=devnet',
      },
    ];
  }
}

// Singleton instance
export const learningProgressService = new LocalLearningProgressService();
