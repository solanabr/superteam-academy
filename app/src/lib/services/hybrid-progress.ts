import type { AnchorWallet } from "@solana/wallet-adapter-react";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
} from "@/types";
import type { LearningProgressService } from "./learning-progress";
import { LocalStorageProgressService } from "./learning-progress";
import { OnChainProgressService } from "./onchain-progress";

/**
 * Hybrid service that combines on-chain reads with localStorage writes.
 *
 * - XP: reads from chain when wallet connected, localStorage otherwise
 * - Progress: reads from chain first, falls back to localStorage
 * - Enrollment: sends real tx when wallet connected, localStorage otherwise
 * - Streaks: always localStorage (not tracked on-chain in deployed program)
 * - Leaderboard: merges on-chain holders with local data
 * - Credentials: on-chain via DAS when available, empty otherwise
 * - Achievements: always localStorage
 */
export class HybridProgressService implements LearningProgressService {
  private local: LocalStorageProgressService;
  private onchain: OnChainProgressService;
  private walletConnected = false;

  constructor() {
    this.local = new LocalStorageProgressService();
    this.onchain = new OnChainProgressService();
  }

  /**
   * Configure the wallet for on-chain operations.
   * When set, reads will attempt on-chain first. When null, falls back to localStorage only.
   * @param wallet - Connected Anchor wallet, or null when disconnected
   */
  setWallet(wallet: AnchorWallet | null) {
    this.walletConnected = !!wallet;
    this.onchain.setWallet(wallet);
  }

  /** Whether the service is currently reading from on-chain state. */
  get isOnChain(): boolean {
    return this.walletConnected;
  }

  // ---- XP ----------------------------------------------------------------

  async getXP(userId: string): Promise<number> {
    if (!this.walletConnected) {
      return this.local.getXP(userId);
    }

    // Try on-chain first, fall back to localStorage
    try {
      const onchainXp = await this.onchain.getXP(userId);
      const localXp = await this.local.getXP(userId);
      // Return the higher of on-chain or local (user may have earned
      // local XP before connecting wallet)
      return Math.max(onchainXp, localXp);
    } catch {
      return this.local.getXP(userId);
    }
  }

  async addXP(userId: string, amount: number): Promise<number> {
    // Always write to localStorage (instant feedback)
    return this.local.addXP(userId, amount);
  }

  // ---- Progress ----------------------------------------------------------

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    if (!this.walletConnected) {
      return this.local.getProgress(userId, courseId);
    }

    try {
      const onchainProgress = await this.onchain.getProgress(userId, courseId);
      if (onchainProgress) return onchainProgress;
    } catch {
      // Fall through to localStorage
    }
    return this.local.getProgress(userId, courseId);
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    if (!this.walletConnected) {
      return this.local.getAllProgress(userId);
    }

    try {
      const onchainProgress = await this.onchain.getAllProgress(userId);
      if (onchainProgress.length > 0) {
        // Merge: on-chain enrollments take priority, add local-only ones
        const localProgress = await this.local.getAllProgress(userId);
        const onchainIds = new Set(onchainProgress.map((p) => p.courseId));
        const localOnly = localProgress.filter(
          (p) => !onchainIds.has(p.courseId),
        );
        return [...onchainProgress, ...localOnly];
      }
    } catch {
      // Fall through
    }
    return this.local.getAllProgress(userId);
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    // Always write to localStorage for instant UI feedback
    await this.local.completeLesson(userId, courseId, lessonIndex);
    // On-chain completion requires backend signature — handled separately
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    if (this.walletConnected) {
      try {
        await this.onchain.enrollInCourse(userId, courseId);
        // Also track locally for immediate UI state
        await this.local.enrollInCourse(userId, courseId);
        return;
      } catch (err) {
        console.warn(
          "On-chain enrollment failed, falling back to localStorage:",
          err,
        );
      }
    }
    await this.local.enrollInCourse(userId, courseId);
  }

  // ---- Streaks (always localStorage) ------------------------------------

  async getStreak(userId: string): Promise<StreakData> {
    return this.local.getStreak(userId);
  }

  async recordActivity(userId: string): Promise<StreakData> {
    return this.local.recordActivity(userId);
  }

  // ---- Leaderboard -------------------------------------------------------

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    if (this.walletConnected) {
      try {
        const onchainBoard = await this.onchain.getLeaderboard(
          timeframe,
          courseId,
        );
        if (onchainBoard.length > 0) return onchainBoard;
      } catch {
        // Fall through to localStorage mock
      }
    }
    return this.local.getLeaderboard(timeframe, courseId);
  }

  // ---- Credentials -------------------------------------------------------

  async getCredentials(wallet: string): Promise<Credential[]> {
    if (this.walletConnected) {
      try {
        const onchainCreds = await this.onchain.getCredentials(wallet);
        if (onchainCreds.length > 0) return onchainCreds;
      } catch {
        // Fall through
      }
    }
    return this.local.getCredentials(wallet);
  }

  // ---- Achievements (always localStorage) --------------------------------

  async getAchievements(userId: string | null): Promise<Achievement[]> {
    return this.local.getAchievements(userId);
  }

  async claimAchievement(userId: string, achievementId: number): Promise<void> {
    return this.local.claimAchievement(userId, achievementId);
  }
}
