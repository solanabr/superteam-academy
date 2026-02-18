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
  getLeaderboard(options?: { limit?: number }): Promise<LeaderboardEntry[]>;
  getCredentials(userId: string): Promise<Credential[]>;
  completeLesson(params: {
    userId: string;
    courseId: string;
    lessonIndex: number;
    xpReward: number;
  }): Promise<void>;
  enroll(userId: string, courseId: string): Promise<void>;
  finalizeCourse(userId: string, courseId: string, lessonCount: number): Promise<void>;
  claimCompletionBonus(userId: string, courseId: string, xpAmount: number): Promise<void>;
  issueCredential(params: { userId: string; trackId: string; trackName: string; xpEarned: number }): Promise<void>;
  claimAchievement(userId: string, achievementId: string): Promise<boolean>;
}
