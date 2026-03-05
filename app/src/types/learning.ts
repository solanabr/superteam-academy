import type { PublicKey } from "@solana/web3.js";

export interface Progress {
  courseId: string;
  completedLessons: number[];
  completedChallenges: number[];
  totalLessons: number;
  totalChallenges: number;
  enrolledAt: string;
  lastActivityAt: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  freezeUsed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  mint: string;
  track: string;
  level: number;
  metadataUri: string;
  imageUri: string;
  name: string;
  description: string;
  compressed: boolean;
  owner: PublicKey;
  coursesCompleted?: number;
  totalXp?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  metadataUri: string;
  imageUri: string;
  xpReward: number;
  claimed: boolean;
  claimedAt?: string;
}

export type ActivityType =
  | "course_started"
  | "lesson_started"
  | "course_completed"
  | "lesson_completed"
  | "challenge_started"
  | "challenge_completed"
  | "achievement_claimed";

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  timestamp: string;
  xpGained: number;
  /** Nome do curso, aula ou desafio */
  label: string;
  /** Slug ou ID para link */
  slug?: string;
  /** 'course' | 'lesson' | 'challenge' para navegação */
  kind?: "course" | "lesson" | "challenge";
}

/**
 * Service interface for learning progress.
 *
 * Fully implemented on Devnet:
 * - getXP, getProgress, getLeaderboard, getCredentials (on-chain reads)
 *
 * Stubbed with clean abstractions (backend-signed transactions):
 * - completeLesson, finalizeCourse, issueCredential, claimAchievement
 *
 * Frontend-only:
 * - getStreak, getRecentActivities, recordActivity (localStorage)
 */
export interface LearningProgressService {
  // --- On-chain reads ---
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getXP(userId: string): Promise<number>;
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
  ): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;

  // --- Backend-signed (stubbed) ---
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void>;
  finalizeCourse(userId: string, courseId: string): Promise<void>;
  issueCredential(userId: string, courseId: string): Promise<void>;
  claimAchievement(userId: string, achievementId: string): Promise<void>;

  // --- Frontend-only ---
  getStreak(userId: string): Promise<StreakData>;
  getRecentActivities(userId: string, limit?: number): Promise<Activity[]>;
  recordActivity(
    userId: string,
    activity: Omit<Activity, "id" | "userId" | "timestamp">,
  ): Promise<void>;
}
