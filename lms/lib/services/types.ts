import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";

export interface CompleteLessonResult {
  ok: boolean;
  txSignature: string | null;
  finalizeTxSignature: string | null;
  credentialTxSignature: string | null;
}

export interface OnChainResult {
  ok: boolean;
  txSignature: string | null;
}

export interface PracticeProgressData {
  completed: string[];
  txHashes: Record<string, string>;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<CompleteLessonResult>;
  enrollInCourse(userId: string, courseId: string): Promise<OnChainResult>;
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementId: number): Promise<OnChainResult>;
  getProfile(userId: string): Promise<UserProfile | null>;
  getDisplayName(userId: string): Promise<string | null>;
  setDisplayName(userId: string, name: string): Promise<void>;
  setBio(userId: string, bio: string): Promise<void>;
  getBio(userId: string): Promise<string | null>;
  getCourses(): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  getPracticeProgress(userId: string): Promise<PracticeProgressData>;
  completePracticeChallenge(userId: string, challengeId: string, xpReward: number): Promise<OnChainResult>;
}
