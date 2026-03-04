import type { PublicKey } from "@solana/web3.js";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
  Course,
  User,
  CourseFilters,
  PaginatedResponse,
} from "@/types";

/**
 * Learning Progress Service Interface
 * 
 * Clean abstraction layer for learning progress tracking.
 * Stub implementation uses local storage, can be swapped for on-chain calls.
 * 
 * @see docs/SPEC.md for on-chain integration points
 */
export interface LearningProgressService {
  /**
   * Get learner's progress for a specific course
   */
  getProgress(userId: string, courseId: string): Promise<Progress | null>;

  /**
   * Get all course progress for a learner
   */
  getAllProgress(userId: string): Promise<Progress[]>;

  /**
   * Mark a lesson as complete
   * In production: triggers backend-signed transaction
   */
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<{ xpEarned: number; newTotal: number }>;

  /**
   * Enroll user in a course
   * In production: creates Enrollment PDA
   */
  enrollInCourse(userId: string, courseId: string): Promise<void>;

  /**
   * Unenroll from a course (if not completed)
   * In production: closes Enrollment PDA after 24h cooldown
   */
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;

  /**
   * Finalize course completion
   * In production: awards completion XP and updates credential
   */
  finalizeCourse(
    userId: string,
    courseId: string
  ): Promise<{ xpEarned: number; credentialIssued: boolean }>;
}

/**
 * XP & Gamification Service Interface
 */
export interface GamificationService {
  /**
   * Get user's total XP from token balance
   * In production: reads from Token-2022 balance
   */
  getXP(userId: string): Promise<number>;

  /**
   * Get user's current streak data
   */
  getStreak(userId: string): Promise<StreakData>;

  /**
   * Get user's achievements (bitmap decoded)
   */
  getAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Claim an achievement
   * In production: backend-signed transaction
   */
  claimAchievement(
    userId: string,
    achievementId: string
  ): Promise<{ xpEarned: number }>;

  /**
   * Get leaderboard rankings
   * In production: indexed from XP token balances via Helius DAS API
   */
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    options?: { limit?: number; courseId?: string }
  ): Promise<LeaderboardEntry[]>;

  /**
   * Get user's rank on leaderboard
   */
  getUserRank(
    userId: string,
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<number>;
}

/**
 * Credential Service Interface
 * Handles on-chain credential verification and display
 */
export interface CredentialService {
  /**
   * Get all credentials for a wallet
   * In production: queries Photon indexer for compressed credentials
   */
  getCredentials(wallet: PublicKey | string): Promise<Credential[]>;

  /**
   * Get a specific credential by ID
   */
  getCredential(credentialId: string): Promise<Credential | null>;

  /**
   * Verify credential ownership and authenticity
   * In production: validates ZK proof
   */
  verifyCredential(
    credentialId: string,
    wallet: PublicKey | string
  ): Promise<{ isValid: boolean; details?: string }>;

  /**
   * Get credential metadata (for display)
   */
  getCredentialMetadata(
    credentialId: string
  ): Promise<{ name: string; image: string; attributes: Record<string, string> }>;
}

/**
 * Course Content Service Interface
 * Abstracts CMS interactions
 */
export interface CourseService {
  /**
   * Get all courses with optional filters
   */
  getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>>;

  /**
   * Get a single course by slug
   */
  getCourseBySlug(slug: string): Promise<Course | null>;

  /**
   * Get a single course by ID
   */
  getCourseById(id: string): Promise<Course | null>;

  /**
   * Get recommended courses for a user
   */
  getRecommendedCourses(userId: string, limit?: number): Promise<Course[]>;

  /**
   * Search courses
   */
  searchCourses(query: string): Promise<Course[]>;

  /**
   * Get course learning paths
   */
  getLearningPaths(): Promise<{ id: string; name: string; courses: Course[] }[]>;
}

/**
 * User Service Interface
 */
export interface UserService {
  /**
   * Get user profile
   */
  getUser(userId: string): Promise<User | null>;

  /**
   * Get user by wallet address
   */
  getUserByWallet(wallet: string): Promise<User | null>;

  /**
   * Update user profile
   */
  updateUser(userId: string, updates: Partial<User>): Promise<User>;

  /**
   * Link auth provider to account
   */
  linkAuthProvider(
    userId: string,
    provider: "wallet" | "google" | "github",
    credentials: unknown
  ): Promise<void>;

  /**
   * Get user stats summary
   */
  getUserStats(userId: string): Promise<{
    xp: number;
    level: number;
    rank: number;
    coursesCompleted: number;
    streak: number;
    achievementCount: number;
  }>;
}

/**
 * Analytics Service Interface
 */
export interface AnalyticsService {
  /**
   * Track page view
   */
  trackPageView(path: string, properties?: Record<string, unknown>): void;

  /**
   * Track custom event
   */
  trackEvent(
    event: string,
    properties?: Record<string, unknown>
  ): void;

  /**
   * Identify user for analytics
   */
  identifyUser(userId: string, traits?: Record<string, unknown>): void;

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void;
}
