import type {
  Enrollment,
  UserProfile,
  UserStats,
  ProfileUpdateData,
} from "@/types/user";
import type {
  StreakData,
  Achievement,
  LeaderboardEntry,
  XPTransaction,
} from "@/types/gamification";
import type { RunResult } from "@/types/challenge";
import type { TestCase } from "@/types/course";

export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  progressPct: number;
  completedAt: string | null;
}

export interface Credential {
  id: string;
  trackId: number;
  trackName: string;
  level: "bronze" | "silver" | "gold";
  issuedAt: string;
  walletAddress: string;
  mintAddress?: string;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void>;
  getEnrollments(userId: string): Promise<Enrollment[]>;
  enroll(userId: string, courseId: string): Promise<void>;
  unenroll(userId: string, courseId: string): Promise<void>;
}

export interface GamificationService {
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  awardXP(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
  ): Promise<void>;
  getAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementIndex: number): Promise<void>;
  getXPHistory(userId: string, limit?: number): Promise<XPTransaction[]>;
}

export interface LeaderboardService {
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    limit?: number,
  ): Promise<LeaderboardEntry[]>;
  getUserRank(userId: string, timeframe: string): Promise<number>;
}

export interface CredentialService {
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialByTrack(
    walletAddress: string,
    trackId: number,
  ): Promise<Credential | null>;
}

export interface ProfileService {
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  getProfileById(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: ProfileUpdateData): Promise<UserProfile>;
  checkUsernameAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean>;
  getProfileStats(userId: string): Promise<UserStats | null>;
  getCompletedCourses(userId: string): Promise<Enrollment[]>;
  /** Seed profile + user_stats rows on first login. No-op if already exists. */
  ensureProfile(user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    preferredTheme?: string;
    preferredLanguage?: string;
  }): Promise<void>;
}

export interface ChallengeService {
  runCode(
    code: string,
    language: string,
    testCases: TestCase[],
  ): Promise<RunResult>;
  validateSolution(code: string, expectedOutput: string): Promise<boolean>;
}

export interface AvatarService {
  /** Upload avatar for a user. Returns the public URL. */
  uploadAvatar(
    userId: string,
    file: File,
  ): Promise<{ avatarUrl: string }>;
  /** Delete avatar for a user, reverting to default. */
  deleteAvatar(userId: string): Promise<void>;
}

export interface NewsletterService {
  /** Subscribe an email to the newsletter. Returns whether the email was already subscribed. */
  subscribe(
    email: string,
    locale?: string,
  ): Promise<{ alreadySubscribed: boolean }>;
}

