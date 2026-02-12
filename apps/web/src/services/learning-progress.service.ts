import type { Progress, StreakData, LeaderboardEntry, Credential } from '@/types';

export interface LearningProgressService {
  /** Get user progress for a specific course */
  getProgress(userId: string, courseId: string): Promise<Progress[]>;

  /** Mark a lesson as completed */
  completeLesson(userId: string, courseId: string, lessonId: string): Promise<void>;

  /** Get total XP for a user */
  getXP(userId: string): Promise<number>;

  /** Get streak data for a user */
  getStreak(userId: string): Promise<StreakData>;

  /** Get leaderboard entries */
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;

  /** Get on-chain credentials for a wallet */
  getCredentials(walletAddress: string): Promise<Credential[]>;

  /** Get completion percentage for a course */
  getCourseCompletionRate(userId: string, courseId: string): Promise<number>;

  /** Enroll user in a course */
  enrollInCourse(userId: string, courseId: string): Promise<void>;
}
