import type { UserProgress, StreakData, LeaderboardEntry, Credential, Achievement } from '@/types';
import { PublicKey } from '@solana/web3.js';
import { fetchXpBalance } from '@/lib/solana/program-client';
import { fetchWalletCredentials, fetchAsset, parseCredential } from '@/lib/solana/helius-client';

/**
 * LearningProgressService
 *
 * Clean abstraction for learning progress tracking.
 * Initially uses local storage, designed to be swapped for on-chain calls.
 */
export interface ILearningProgressService {
  // Progress tracking
  getProgressForUserCourse(userId: string, courseId: string): Promise<UserProgress | null>;
  getAllUserProgress(userId: string): Promise<UserProgress[]>;
  completeLesson(userId: string, courseId: string, lessonId: string): Promise<void>;

  // XP and leveling
  getXPBalance(walletAddress: string): Promise<number>;
  awardXP(userId: string, amount: number, reason: string): Promise<void>;

  // Streaks
  getStreakData(userId: string): Promise<StreakData>;
  recordDailyActivity(userId: string): Promise<void>;

  // Leaderboard
  getLeaderboardEntries(
    timeframe: 'weekly' | 'monthly' | 'all-time',
    limit?: number
  ): Promise<LeaderboardEntry[]>;

  // Credentials
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialById(credentialId: string): Promise<Credential | null>;

  // Achievements
  getAchievements(userId: string): Promise<Achievement[]>;
  getUnlockedAchievements(userId: string): Promise<Achievement[]>;
}

/**
 * Local Storage Implementation
 * Stub implementation for MVP - will be replaced with on-chain calls
 */
export class LocalLearningProgressService implements ILearningProgressService {
  private readonly STORAGE_PREFIX = 'lms_';

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(this.getStorageKey(key));
    return item ? JSON.parse(item) : null;
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
  }

  async getProgressForUserCourse(userId: string, courseId: string): Promise<UserProgress | null> {
    const allProgress = this.getItem<UserProgress[]>(`progress_${userId}`) || [];
    return allProgress.find((p) => p.courseId === courseId) || null;
  }

  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    return this.getItem<UserProgress[]>(`progress_${userId}`) || [];
  }

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<void> {
    const allProgress = this.getItem<UserProgress[]>(`progress_${userId}`) || [];
    const courseProgress = allProgress.find((p) => p.courseId === courseId);

    if (courseProgress) {
      if (!courseProgress.completedLessons.includes(lessonId)) {
        courseProgress.completedLessons.push(lessonId);
      }
    } else {
      allProgress.push({
        userId,
        courseId,
        completedLessons: [lessonId],
        startedAt: new Date(),
        xpEarned: 0,
      });
    }

    this.setItem(`progress_${userId}`, allProgress);
  }

  async getXPBalance(walletAddress: string): Promise<number> {
    // Stub: In production, this reads from Token-2022 balance
    return this.getItem<number>(`xp_${walletAddress}`) || 0;
  }

  async awardXP(userId: string, amount: number, _reason: string): Promise<void> {
    const currentXP = this.getItem<number>(`xp_${userId}`) || 0;
    this.setItem(`xp_${userId}`, currentXP + amount);
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const defaultStreak: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      streakHistory: [],
    };
    return this.getItem<StreakData>(`streak_${userId}`) || defaultStreak;
  }

  async recordDailyActivity(userId: string): Promise<void> {
    const streakData = await this.getStreakData(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = new Date(streakData.lastActivityDate).toISOString().split('T')[0];

    if (today === lastActivity) {
      return; // Already recorded today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActivity === yesterdayStr) {
      streakData.currentStreak += 1;
    } else {
      streakData.currentStreak = 1;
    }

    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    streakData.lastActivityDate = new Date();
    streakData.streakHistory.push({ date: today, active: true });

    // Keep only last 365 days of history
    if (streakData.streakHistory.length > 365) {
      streakData.streakHistory = streakData.streakHistory.slice(-365);
    }

    this.setItem(`streak_${userId}`, streakData);
  }

  async getLeaderboardEntries(
    _timeframe: 'weekly' | 'monthly' | 'all-time',
    limit = 100
  ): Promise<LeaderboardEntry[]> {
    const storedEntries = this.getItem<LeaderboardEntry[]>('leaderboard') || [];
    return storedEntries.slice(0, limit);
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    // Stub: In production, this reads Metaplex Core NFTs
    return this.getItem<Credential[]>(`credentials_${walletAddress}`) || [];
  }

  async getCredentialById(credentialId: string): Promise<Credential | null> {
    // Stub: In production, this fetches NFT by mint address
    const allCredentials = this.getItem<Record<string, Credential>>('all_credentials') || {};
    return allCredentials[credentialId] || null;
  }

  async getAchievements(_userId: string): Promise<Achievement[]> {
    return this.getItem<Achievement[]>('achievements_catalog') || [];
  }

  async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    return this.getItem<Achievement[]>(`unlocked_achievements_${userId}`) || [];
  }
}

export class OnChainLearningProgressService implements ILearningProgressService {
  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    return (await response.json()) as T;
  }

  private toUserProgress(entry: any): UserProgress {
    return {
      userId: String(entry.userId || ''),
      courseId: String(entry.courseId || ''),
      completedLessons: [],
      startedAt: entry.lastAccessedAt ? new Date(entry.lastAccessedAt) : new Date(),
      completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
      xpEarned: Number(entry.xpEarned || 0),
      currentLesson: entry.currentLesson,
    };
  }

  private toCredentialFromParsed(parsed: any): Credential {
    return {
      id: parsed.id,
      mintAddress: parsed.id,
      track: parsed.trackName || 'Unknown',
      level: Number(parsed.level || 0),
      coursesCompleted: Number(parsed.coursesCompleted || 0),
      totalXp: Number(parsed.totalXp || 0),
      imageUrl: parsed.image || '',
      metadataUri: parsed.metadataUri || '',
      issuedAt: parsed.issuedAt ? new Date(parsed.issuedAt) : new Date(),
    };
  }

  private async resolveCurrentUserWallet(userId: string): Promise<string | null> {
    const profile = await this.fetchJson<{ user?: { id?: string; walletAddress?: string } }>(
      '/api/profile'
    );

    if (!profile.user?.id || profile.user.id !== userId) {
      return null;
    }

    return profile.user.walletAddress || null;
  }

  async getProgressForUserCourse(userId: string, courseId: string): Promise<UserProgress | null> {
    const profile = await this.fetchJson<{ coursesEnrolled?: any[] }>('/api/profile');
    const enrollment = (profile.coursesEnrolled || []).find((item) => {
      const id = item?.courseId?.id || item?.courseId?._id || item?.courseId;
      return String(id || '') === courseId || String(item?.course_slug || '') === courseId;
    });

    if (!enrollment) {
      return null;
    }

    return this.toUserProgress({
      userId,
      courseId,
      xpEarned: enrollment?.xp_earned || 0,
      lastAccessedAt: enrollment?.last_accessed_at,
      completedAt: enrollment?.completed_at,
    });
  }

  async getAllUserProgress(_userId: string): Promise<UserProgress[]> {
    const profile = await this.fetchJson<{ coursesEnrolled?: any[]; user?: { id?: string } }>(
      '/api/profile'
    );
    const currentUserId = String(profile.user?.id || '');

    return (profile.coursesEnrolled || []).map((item) =>
      this.toUserProgress({
        userId: currentUserId,
        courseId: item?.courseId?.id || item?.courseId?._id || item?.courseId || '',
        xpEarned: item?.xp_earned || 0,
        lastAccessedAt: item?.last_accessed_at,
        completedAt: item?.completed_at,
      })
    );
  }

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<void> {
    const walletAddress = await this.resolveCurrentUserWallet(userId);
    if (!walletAddress) {
      throw new Error('Wallet address is required to complete lesson on-chain');
    }

    const lessonIndex = Number.parseInt(lessonId, 10);
    if (Number.isNaN(lessonIndex)) {
      throw new Error('lessonId must be a numeric lesson index for on-chain completion');
    }

    await this.fetchJson('/api/lessons/complete', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        lessonIndex,
        learnerWallet: walletAddress,
      }),
    });
  }

  async getXPBalance(walletAddress: string): Promise<number> {
    try {
      return await fetchXpBalance(new PublicKey(walletAddress));
    } catch {
      return 0;
    }
  }

  async awardXP(userId: string, amount: number, reason: string): Promise<void> {
    let recipientWallet = userId;
    try {
      new PublicKey(userId);
    } catch {
      recipientWallet = (await this.resolveCurrentUserWallet(userId)) || '';
    }

    if (!recipientWallet) {
      throw new Error('Recipient wallet not found');
    }

    await this.fetchJson('/api/xp/reward', {
      method: 'POST',
      body: JSON.stringify({
        recipientWallet,
        amount,
        reason,
      }),
    });
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const result = await this.fetchJson<{ streak?: any }>(`/api/streak/${userId}`);
    const streak = result.streak || {};

    return {
      currentStreak: Number(streak.currentStreak || 0),
      longestStreak: Number(streak.longestStreak || 0),
      lastActivityDate: streak.lastActivityDate ? new Date(streak.lastActivityDate) : new Date(),
      streakHistory: streak.weeklyActivity || streak.streakHistory || [],
    };
  }

  async recordDailyActivity(userId: string): Promise<void> {
    await this.fetchJson(`/api/streak/${userId}`, { method: 'POST' });
  }

  async getLeaderboardEntries(
    timeframe: 'weekly' | 'monthly' | 'all-time',
    limit = 100
  ): Promise<LeaderboardEntry[]> {
    if (timeframe === 'all-time') {
      const onChain = await this.fetchJson<{ entries?: any[] }>('/api/leaderboard/onchain?limit=' + limit);
      return (onChain.entries || []).map((entry) => ({
        rank: Number(entry.rank || 0),
        walletAddress: String(entry.wallet || ''),
        displayName: String(entry.displayName || ''),
        avatarUrl: entry.avatar,
        xp: Number(entry.xpBalance || 0),
        level: Number(entry.level || 0),
        streak: entry.currentStreak,
      }));
    }

    const offChain = await this.fetchJson<{ leaderboard?: any[] }>(
      `/api/gamification/leaderboard?timeframe=${timeframe}&limit=${limit}`
    );

    return (offChain.leaderboard || []).map((entry, index) => ({
      rank: Number(entry.rank || index + 1),
      walletAddress: String(entry.walletAddress || ''),
      displayName: String(entry.displayName || ''),
      avatarUrl: entry.avatarUrl,
      xp: Number(entry.xp || entry.totalXp || 0),
      level: Number(entry.level || 0),
      streak: entry.currentStreak,
    }));
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    const parsedCredentials = await fetchWalletCredentials(walletAddress);
    if (parsedCredentials.length > 0) {
      return parsedCredentials.map((credential) => this.toCredentialFromParsed(credential));
    }

    const fallback = await this.fetchJson<{ certificates?: any[] }>('/api/certificates');
    return (fallback.certificates || []).map((cert) => ({
      id: String(cert.id),
      mintAddress: String(cert.mintAddress || cert.id),
      track: String(cert.courseName || 'Unknown'),
      level: 0,
      coursesCompleted: 1,
      totalXp: Number(cert.xpEarned || 0),
      imageUrl: '',
      metadataUri: String(cert.metadataUri || ''),
      issuedAt: cert.issuedDate ? new Date(cert.issuedDate) : new Date(),
    }));
  }

  async getCredentialById(credentialId: string): Promise<Credential | null> {
    const asset = await fetchAsset(credentialId);
    if (asset) {
      return this.toCredentialFromParsed(parseCredential(asset));
    }

    try {
      const fallback = await this.fetchJson<{ certificate?: any }>(`/api/certificates/${credentialId}`);
      if (!fallback.certificate) {
        return null;
      }

      return {
        id: String(fallback.certificate.id),
        mintAddress: String(fallback.certificate.mintAddress || fallback.certificate.id),
        track: String(fallback.certificate.courseName || 'Unknown'),
        level: 0,
        coursesCompleted: 1,
        totalXp: Number(fallback.certificate.xpEarned || 0),
        imageUrl: '',
        metadataUri: String(fallback.certificate.metadataUri || ''),
        issuedAt: fallback.certificate.issuedDate
          ? new Date(fallback.certificate.issuedDate)
          : new Date(),
      };
    } catch {
      return null;
    }
  }

  async getAchievements(_userId: string): Promise<Achievement[]> {
    const profile = await this.fetchJson<{ achievements?: { available?: Achievement[] } }>(
      '/api/gamification'
    );
    return profile.achievements?.available || [];
  }

  async getUnlockedAchievements(_userId: string): Promise<Achievement[]> {
    const profile = await this.fetchJson<{ achievements?: { unlocked?: Achievement[] } }>(
      '/api/gamification'
    );
    return profile.achievements?.unlocked || [];
  }
}

export type LearningProgressProvider = 'local' | 'onchain';

export function createLearningProgressService(
  provider: LearningProgressProvider =
    (process.env.NEXT_PUBLIC_PROGRESS_SERVICE_MODE as LearningProgressProvider) || 'local'
): ILearningProgressService {
  return provider === 'onchain'
    ? new OnChainLearningProgressService()
    : new LocalLearningProgressService();
}

// Export singleton instance
export const learningProgressService = createLearningProgressService();
