/**
 * src/services/interface.ts
 *
 * Defines the contract for the learning service, abstracting the implementation
 * details (Database vs On-Chain).
 */
import { PublicKey } from '@solana/web3.js';
import {
  Progress,
  Credential,
  StreakData,
  LeaderboardEntry,
  Achievement
} from './types';

export interface ILearningService {
  /**
   * Mengambil progres user untuk sebuah course (DB)
   */
  getProgress(userId: string, courseId: string): Promise<Progress>;

  /**
   * Menandai lesson telah selesai (DB)
   */
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void>;

  /**
   * Mengambil balance XP dari wallet (On-Chain Token-2022)
   */
  getXP(wallet: PublicKey): Promise<number>;

  /**
   * Kalkulasi level berdasarkan XP
   * Formula: floor(sqrt(xp / 100))
   */
  getLevel(xp: number): number;

  /**
   * Mengambil data cNFT Credentials user via Helius DAS
   */
  getCredentials(wallet: PublicKey): Promise<Credential[]>;

  /**
   * Mengambil data streak belajar user
   */
  getStreak(userId: string): Promise<StreakData>;

  /**
   * Mengambil daftar leaderboard berdasarkan rentang waktu
   */
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;

  /**
   * Mengambil daftar achievements/badges dari user
   */
  getAchievements(userId: string): Promise<Achievement[]>;
}
