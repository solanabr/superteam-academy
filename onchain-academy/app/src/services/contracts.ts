import { Credential, LeaderboardEntry, LearningProgress } from "@/domain/models";

export type LeaderboardWindow = "weekly" | "monthly" | "all-time";

export type UserStreak = {
  current: number;
  longest: number;
  activeDays: string[];
};

export interface LearningProgressService {
  getProgress(wallet: string, courseId: string): Promise<LearningProgress | null>;
  completeLesson(
    wallet: string,
    courseId: string,
    lessonId: string,
    metadata?: { completionSignature?: string; completionNftId?: string },
  ): Promise<LearningProgress>;
  getXPBalance(wallet: string): Promise<number>;
  getStreakData(wallet: string): Promise<UserStreak>;
  getLeaderboardEntries(window: LeaderboardWindow): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
}

export interface OnchainIdentityService {
  getXPBalance(wallet: string): Promise<number>;
  getCredentials(wallet: string): Promise<Credential[]>;
  verifyCredential(mintAddress: string): Promise<boolean>;
  enroll(courseId: string, wallet: string): Promise<string>;
}

export interface LeaderboardService {
  getLeaderboard(window: LeaderboardWindow, courseId?: string | null): Promise<LeaderboardEntry[]>;
}

export interface AchievementService {
  claimAchievement(wallet: string, achievementId: string): Promise<{ receiptId: string }>;
  listAchievements(wallet: string): Promise<string[]>;
}
