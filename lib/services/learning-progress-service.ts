import { PublicKey } from '@solana/web3.js';
import { Credential, LeaderboardEntry, Progress, StreakData, Timeframe } from '@/lib/types';

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  enrollCourse(userId: string, courseId: string): Promise<void>;
  getEnrollment(userId: string, courseId: string): Promise<boolean>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
