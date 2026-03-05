import { PublicKey } from "@solana/web3.js";
import type {
  Achievement,
  Activity,
  Credential,
  LeaderboardEntry,
  LearningProgressService,
  Progress,
  StreakData,
} from "@/types/learning";
import {
  getXpBalance,
  getEnrollment,
  getLeaderboardFromChain,
  getCredentialsForWallet,
} from "@/services/onchain";

const STORAGE_PREFIX = "st-academy";

function storageKey(userId: string, suffix: string): string {
  return `${STORAGE_PREFIX}:${userId}:${suffix}`;
}

function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Hybrid implementation aligned with INTEGRATION.md spec.
 *
 * On-chain reads (fully implemented on Devnet):
 * - XP balance from Token-2022 token accounts
 * - Enrollment data with 256-bit lesson bitmap
 * - Leaderboard by indexing XP balances
 * - Credentials via Helius DAS API (Metaplex Core NFTs)
 *
 * Stubbed with clean abstractions (backend-signed transactions):
 * - Lesson completion (requires backendSigner)
 * - Course finalization (requires backendSigner)
 * - Credential issuance (requires backendSigner)
 * - Achievement claiming (requires backendSigner)
 *
 * Frontend-only (localStorage):
 * - Streak tracking
 * - Activity history
 */
export const learningProgressService: LearningProgressService = {
  // ─── On-chain reads ──────────────────────────────────────────

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const key = storageKey(userId, `progress:${courseId}`);
    const stored = getStored<Partial<Progress> | null>(key, null);
    const defaultProgress: Progress = {
      courseId,
      completedLessons: [],
      completedChallenges: [],
      totalLessons: 0,
      totalChallenges: 0,
      enrolledAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    // Try to merge on-chain enrollment data
    try {
      const walletPubkey = new PublicKey(userId);
      const enrollment = await getEnrollment(courseId, walletPubkey);
      if (enrollment) {
        const completedLessons: number[] = [];
        for (let i = 0; i < 256; i++) {
          const wordIndex = Math.floor(i / 64);
          const bitIndex = i % 64;
          if (
            wordIndex < enrollment.lessonFlags.length &&
            (enrollment.lessonFlags[wordIndex] & (1 << bitIndex)) !== 0
          ) {
            completedLessons.push(i);
          }
        }
        return {
          ...defaultProgress,
          ...stored,
          completedLessons:
            completedLessons.length > 0
              ? completedLessons
              : (stored?.completedLessons ?? []),
          enrolledAt: new Date(enrollment.enrolledAt * 1000).toISOString(),
          lastActivityAt: enrollment.completedAt
            ? new Date(enrollment.completedAt * 1000).toISOString()
            : (stored?.lastActivityAt ?? defaultProgress.lastActivityAt),
        };
      }
    } catch {
      // Not a valid public key or RPC error — fall back to localStorage
    }

    return { ...defaultProgress, ...stored } as Progress;
  },

  async getXP(userId: string): Promise<number> {
    // On-chain XP balance from Token-2022 (0 decimals, soulbound)
    try {
      const walletPubkey = new PublicKey(userId);
      const onChainXp = await getXpBalance(walletPubkey);
      if (onChainXp > 0) return onChainXp;
    } catch {
      // Not a valid pubkey or RPC error
    }
    // Fallback to localStorage
    const key = storageKey(userId, "xp");
    return getStored<number>(key, 0);
  },

  async getLeaderboard(
    _timeframe: "weekly" | "monthly" | "alltime",
  ): Promise<LeaderboardEntry[]> {
    // Fetch from on-chain XP token balances via RPC scan
    try {
      const entries = await getLeaderboardFromChain();
      if (entries.length > 0) return entries;
    } catch {
      // RPC error — fall back to empty
    }
    return [];
  },

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    // Fetch Metaplex Core NFTs via Helius DAS API
    try {
      return await getCredentialsForWallet(wallet);
    } catch {
      return [];
    }
  },

  async getAchievements(userId: string): Promise<Achievement[]> {
    // Stub: achievement types are on-chain, receipts track claims.
    // Full implementation will query all AchievementType accounts and
    // check AchievementReceipt PDAs for the user.
    const key = storageKey(userId, "achievements");
    return getStored<Achievement[]>(key, []);
  },

  // ─── Backend-signed stubs ────────────────────────────────────
  // These operations require the backend's keypair to co-sign.
  // The frontend builds the transaction, sends it to an API endpoint,
  // which adds the backendSigner signature before submitting.

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    // Stub: complete_lesson instruction requires backendSigner.
    // On-chain: awards XP (xpPerLesson) and sets bit in lessonFlags bitmap.
    // For now, track locally until the backend signing endpoint is connected.
    const key = storageKey(userId, `progress:${courseId}`);
    const progress = await this.getProgress(userId, courseId);
    if (progress.completedLessons.includes(lessonIndex)) return;
    const completedLessons = [...progress.completedLessons, lessonIndex].sort(
      (a, b) => a - b,
    );
    setStored(key, {
      ...progress,
      completedLessons,
      lastActivityAt: new Date().toISOString(),
    });
  },

  async finalizeCourse(_userId: string, _courseId: string): Promise<void> {
    // Stub: finalize_course instruction requires backendSigner.
    // On-chain: verifies all lessons completed, awards 50% bonus XP,
    // sends creator rewards, sets completedAt timestamp.
    // Will be connected when backend signing endpoint is available.
    console.info("[stub] finalizeCourse — requires backend-signed transaction");
  },

  async issueCredential(_userId: string, _courseId: string): Promise<void> {
    // Stub: issue_credential instruction requires backendSigner.
    // On-chain: creates Metaplex Core NFT with PermanentFreezeDelegate (soulbound),
    // sets credentialAsset on Enrollment PDA, emits CredentialIssued event.
    // Attributes: track_id, level, courses_completed, total_xp.
    console.info(
      "[stub] issueCredential — requires backend-signed transaction",
    );
  },

  async claimAchievement(
    _userId: string,
    _achievementId: string,
  ): Promise<void> {
    // Stub: award_achievement instruction requires minter role.
    // On-chain: creates AchievementReceipt PDA, mints soulbound NFT,
    // awards xpReward XP, increments currentSupply.
    console.info(
      "[stub] claimAchievement — requires backend-signed transaction",
    );
  },

  // ─── Frontend-only (localStorage) ───────────────────────────

  async getStreak(userId: string): Promise<StreakData> {
    // Streaks are frontend-only per spec
    const key = storageKey(userId, "streak");
    return getStored<StreakData>(key, {
      current: 0,
      longest: 0,
      lastActivityDate: null,
      freezeUsed: false,
    });
  },

  async getRecentActivities(userId: string, limit = 20): Promise<Activity[]> {
    const key = storageKey(userId, "activities");
    const stored = getStored<Activity[]>(key, []);
    return stored
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  },

  async recordActivity(
    userId: string,
    activity: Omit<Activity, "id" | "userId" | "timestamp">,
  ): Promise<void> {
    const key = storageKey(userId, "activities");
    const stored = getStored<Activity[]>(key, []);
    const newActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId,
      timestamp: new Date().toISOString(),
    };
    setStored(key, [newActivity, ...stored].slice(0, 100));
  },
};

export { learningProgressService as default };
