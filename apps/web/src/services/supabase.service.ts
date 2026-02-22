/**
 * src/services/supabase.service.ts
 *
 * Supabase-backed implementation of the learning service.
 */
import { PublicKey } from '@solana/web3.js';
import { ILearningService } from './interface';
import {
  Progress,
  Credential,
  StreakData,
  LeaderboardEntry,
  Achievement
} from './types';

export class SupabaseService implements ILearningService {
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    try {
      return {
        userId,
        courseId,
        lessonIndex: 0,
        completed: false,
        xpEarned: 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch progress: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    try {
      // STUB: Insert ke Supabase
    } catch (error) {
      throw new Error(`Failed to complete lesson: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getXP(wallet: PublicKey): Promise<number> {
    try {
      return 0;
    } catch (error) {
      throw new Error('Failed to fetch XP from database.');
    }
  }

  getLevel(xp: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    return [];
  }

  async getStreak(userId: string): Promise<StreakData> {
    try {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(),
        freezeAvailable: false,
      };
    } catch (error) {
      throw new Error('Failed to fetch streak data.');
    }
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    try {
      return [];
    } catch (error) {
      throw new Error('Failed to fetch leaderboard.');
    }
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      return [];
    } catch (error) {
      throw new Error('Failed to fetch achievements.');
    }
  }
}
