/**
 * Learning progress service interface.
 * Clean abstraction so we can swap local storage / stub for on-chain calls later.
 * Job spec: "Create clean service interfaces so we can swap local storage for on-chain calls"
 */

import type { PublicKey } from '@solana/web3.js';
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  LeaderboardTimeframe,
} from './types';

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
