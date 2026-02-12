import type { Achievement } from '@/types';

export interface XPRewardConfig {
  lessonComplete: number;
  challengeComplete: number;
  courseComplete: number;
  streakBonus: number;
  dailyFirst: number;
  quizPerfectScore: number;
}

export interface GamificationService {
  /** Award XP to a user */
  awardXP(userId: string, amount: number, reason: string): Promise<number>;

  /** Get user level based on XP */
  getLevel(xp: number): { level: number; currentXP: number; nextLevelXP: number };

  /** Get all achievements for a user */
  getAchievements(userId: string): Promise<Achievement[]>;

  /** Unlock an achievement */
  unlockAchievement(userId: string, achievementId: string): Promise<Achievement>;

  /** Check and update streak */
  checkStreak(userId: string): Promise<{ streakMaintained: boolean; currentStreak: number }>;

  /** Get XP reward configuration */
  getRewardConfig(): XPRewardConfig;

  /** Calculate rank from XP */
  getRank(userId: string): Promise<number>;
}
