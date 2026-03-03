import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  EnrollmentProgress,
} from "./types";

export interface LearningProgressService {
  getProgress(userId: string): Promise<Progress | null>;
  getEnrollmentProgress(userId: string, courseId: string): Promise<EnrollmentProgress | null>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(options?: { limit?: number; page?: number; timeframe?: "daily" | "weekly" | "all-time"; courseId?: string }): Promise<LeaderboardEntry[]>;
  getCredentials(userId: string, options?: { limit?: number; skip?: number }): Promise<Credential[]>;
  getCredential(id: string): Promise<Credential | null>;
  completeLesson(params: {
    userId: string;
    courseId: string;
    lessonIndex: number;
    xpReward: number;
  }): Promise<void>;
  completeQuiz(params: {
    userId: string;
    courseId: string;
    moduleId: string;
    quizId: string;
    xpReward: number;
  }): Promise<void>;
  enroll(userId: string, courseId: string): Promise<any>;
  unenroll(userId: string, courseId: string): Promise<any>;
  finalizeCourse(userId: string, courseId: string, lessonCount: number): Promise<void>;
  claimCompletionBonus(userId: string, courseId: string, xpAmount: number): Promise<void>;
  issueCredential(params: {
    userId: string;
    wallet?: string;
    courseId: string;
    courseName?: string;
    trackId: string;
    trackName: string;
    xpEarned: number;
    mintAddress?: string;
    verificationUrl?: string;
  }): Promise<string>;
  claimAchievement(userId: string, achievementId: string): Promise<boolean>;
  logActivity(userId: string): Promise<boolean>;
}
