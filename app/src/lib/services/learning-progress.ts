import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
  TransactionResult,
  LessonCompletionResult,
  CourseFinalizationResult,
} from "@/types";

/**
 * Unified interface for tracking learner progress, XP, streaks, and achievements.
 *
 * Designed as a clean abstraction layer so the frontend can swap between
 * localStorage (development/MVP) and on-chain Solana program calls (production)
 * without changing component code.
 *
 * Implementations:
 * - {@link LocalStorageProgressService} — localStorage-backed, works offline
 * - {@link OnChainProgressService} — reads from Solana devnet (Token-2022 XP, cNFT credentials)
 * - {@link HybridProgressService} — merges on-chain reads with localStorage writes
 *
 * @see https://github.com/solanabr/superteam-academy — on-chain program spec
 */
export interface LearningProgressService {
  // -- Progress --------------------------------------------------------------

  /**
   * Retrieve a learner's progress for a specific course.
   * @param userId - Wallet public key or local user identifier
   * @param courseId - Unique course slug (e.g. "solana-fundamentals")
   * @returns Progress object with completed lessons and percentage, or null if not enrolled
   */
  getProgress(userId: string, courseId: string): Promise<Progress | null>;

  /**
   * Retrieve progress across all courses a learner is enrolled in.
   * @param userId - Wallet public key or local user identifier
   * @returns Array of Progress objects, one per enrolled course
   */
  getAllProgress(userId: string): Promise<Progress[]>;

  /**
   * Mark a lesson as completed within a course.
   * Updates the completion bitmap and recalculates progress percentage.
   * In production, this triggers a backend-signed transaction to update the on-chain enrollment PDA.
   * @param userId - Wallet public key or local user identifier
   * @param courseId - Unique course slug
   * @param lessonIndex - Zero-based index of the lesson within the course
   * @returns Lesson completion result with XP earned and course completion status
   */
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<LessonCompletionResult>;

  /**
   * Enroll a learner in a course, creating a new progress record.
   * In production, this creates an on-chain Enrollment PDA via the Solana program.
   * No-ops if the learner is already enrolled.
   * @param userId - Wallet public key or local user identifier
   * @param courseId - Unique course slug
   */
  enrollInCourse(userId: string, courseId: string): Promise<TransactionResult>;

  /**
   * Finalize a completed course: awards completion bonus XP and issues/upgrades credential.
   * On-chain: calls finalize_course then issue_credential/upgrade_credential.
   * @param userId - Wallet public key or local user identifier
   * @param courseId - Unique course slug
   */
  finalizeCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseFinalizationResult>;

  /**
   * Close an enrollment, reclaiming rent.
   * On-chain: calls close_enrollment (learner-signed).
   * @param userId - Wallet public key or local user identifier
   * @param courseId - Unique course slug
   */
  closeEnrollment(userId: string, courseId: string): Promise<TransactionResult>;

  // -- XP --------------------------------------------------------------------

  /**
   * Get the learner's total XP balance.
   * On-chain: reads from the soulbound Token-2022 account (NonTransferable).
   * Level is derived client-side: `Level = floor(sqrt(xp / 100))`.
   * @param userId - Wallet public key or local user identifier
   * @returns Total accumulated XP
   */
  getXP(userId: string): Promise<number>;

  /**
   * Award XP to a learner (manual grant via reward_xp instruction, streak bonus, etc.).
   * In production, this mints soulbound XP tokens via a backend-signed transaction.
   * @param userId - Wallet public key or local user identifier
   * @param amount - XP to add
   * @returns Updated total XP balance and optional tx signature
   */
  addXP(
    userId: string,
    amount: number,
  ): Promise<{ balance: number } & TransactionResult>;

  // -- Streaks ---------------------------------------------------------------

  /**
   * Get the learner's current streak data including calendar history.
   * Streaks are activity-derived — updated as a side effect of lesson completion.
   * @param userId - Wallet public key or local user identifier
   * @returns Streak data with current/longest streak, freeze count, and activity calendar
   */
  getStreak(userId: string): Promise<StreakData>;

  /**
   * Record today's activity, extending or resetting the streak accordingly.
   * If exactly one day was missed and a streak freeze is available, the freeze
   * is consumed to preserve the streak.
   * @param userId - Wallet public key or local user identifier
   * @returns Updated streak data after recording today's activity
   */
  recordActivity(userId: string): Promise<StreakData>;

  // -- Leaderboard -----------------------------------------------------------

  /**
   * Fetch the XP leaderboard for a given time window, optionally filtered by course.
   * On-chain: derived by indexing XP token balances (Helius DAS API).
   * @param timeframe - Time window filter: "weekly", "monthly", or "alltime"
   * @param courseId - Optional course slug to filter rankings by course-specific XP
   * @returns Sorted array of leaderboard entries with rank, XP, level, and streak
   */
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    courseId?: string,
  ): Promise<LeaderboardEntry[]>;

  // -- Credentials -----------------------------------------------------------

  /**
   * Fetch on-chain credentials (evolving compressed NFTs) for a wallet.
   * Each credential represents a learning track (e.g. "Rust", "DeFi") and
   * upgrades as the learner progresses through courses in that track.
   * @param wallet - Solana wallet public key (base58)
   * @returns Array of credentials with mint address, track, level, and metadata
   */
  getCredentials(wallet: string): Promise<Credential[]>;

  // -- Achievements ----------------------------------------------------------

  /**
   * Get all available achievements with the learner's claim status.
   * The on-chain program supports up to 256 achievements via a bitmap on the Learner PDA.
   * @param userId - Wallet public key or local user identifier
   * @returns All achievements with `claimed` flag and optional `claimedAt` timestamp
   */
  getAchievements(userId: string | null): Promise<Achievement[]>;

  /**
   * Claim an unlocked achievement, awarding its XP reward to the learner.
   * In production, this sets the corresponding bit in the on-chain achievement bitmap.
   * No-ops if the achievement is already claimed or does not exist.
   * @param userId - Wallet public key or local user identifier
   * @param achievementId - String achievement identifier
   */
  claimAchievement(
    userId: string,
    achievementId: string,
  ): Promise<TransactionResult>;
}

// Re-export implementations from their dedicated modules
export { LocalStorageProgressService } from "./local-storage-progress";
export { PrismaProgressService } from "./prisma-progress";
