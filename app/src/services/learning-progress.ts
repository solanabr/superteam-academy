import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from "@/types";

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonId: number
  ): Promise<void>;
  finalizeCourse(userId: string, courseId: string): Promise<void>;
  getXPBalance(wallet: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "all-time"
  ): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  enrollInCourse(userId: string, courseId: string): Promise<void>;
}

export class MockLearningProgressService implements LearningProgressService {
  private progressMap: Map<string, Progress> = new Map();
  private xpBalances: Map<string, number> = new Map();

  async getProgress(
    userId: string,
    courseId: string
  ): Promise<Progress | null> {
    const key = `${userId}:${courseId}`;
    return this.progressMap.get(key) ?? null;
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    const results: Progress[] = [];
    this.progressMap.forEach((progress, key) => {
      if (key.startsWith(`${userId}:`)) {
        results.push(progress);
      }
    });
    return results;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonId: number
  ): Promise<void> {
    const key = `${userId}:${courseId}`;
    const progress = this.progressMap.get(key);
    if (!progress) return;

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.percentComplete =
        (progress.completedLessons.length / progress.totalLessons) * 100;

      const currentXp = this.xpBalances.get(userId) ?? 0;
      this.xpBalances.set(userId, currentXp + 100);
    }
  }

  async finalizeCourse(userId: string, courseId: string): Promise<void> {
    const key = `${userId}:${courseId}`;
    const progress = this.progressMap.get(key);
    if (!progress) return;
    progress.completedAt = Date.now() / 1000;
    progress.percentComplete = 100;
  }

  async getXPBalance(wallet: string): Promise<number> {
    return this.xpBalances.get(wallet) ?? 0;
  }

  async getStreakData(userId: string): Promise<StreakData> {
    if (typeof window === "undefined") {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split("T")[0],
        activityCalendar: {},
      };
    }

    const stored = localStorage.getItem(`streak:${userId}`);
    if (stored) {
      return JSON.parse(stored) as StreakData;
    }

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString().split("T")[0],
      activityCalendar: {},
    };
  }

  async getLeaderboard(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _timeframe: "weekly" | "monthly" | "all-time"
  ): Promise<LeaderboardEntry[]> {
    return MOCK_LEADERBOARD;
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    return wallet ? MOCK_CREDENTIALS : [];
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const key = `${userId}:${courseId}`;
    if (this.progressMap.has(key)) return;

    this.progressMap.set(key, {
      courseId,
      lessonFlags: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
      completedLessons: [],
      completedAt: null,
      enrolledAt: Date.now() / 1000,
      credentialAsset: null,
      totalLessons: 20,
      percentComplete: 0,
    });
  }
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    wallet: "7xKX...pR4q",
    displayName: "solana_dev",
    avatarUrl: null,
    xp: 15200,
    level: 12,
    coursesCompleted: 6,
    credentials: 3,
  },
  {
    rank: 2,
    wallet: "3mNB...kY7z",
    displayName: "anchor_pro",
    avatarUrl: null,
    xp: 12800,
    level: 11,
    coursesCompleted: 5,
    credentials: 3,
  },
  {
    rank: 3,
    wallet: "9pQR...wX2a",
    displayName: "rust_builder",
    avatarUrl: null,
    xp: 11500,
    level: 10,
    coursesCompleted: 5,
    credentials: 2,
  },
  {
    rank: 4,
    wallet: "5hFG...mN8b",
    displayName: "defi_wizard",
    avatarUrl: null,
    xp: 9800,
    level: 9,
    coursesCompleted: 4,
    credentials: 2,
  },
  {
    rank: 5,
    wallet: "2jKL...pQ3c",
    displayName: "nft_artist",
    avatarUrl: null,
    xp: 8200,
    level: 9,
    coursesCompleted: 4,
    credentials: 2,
  },
  {
    rank: 6,
    wallet: "8rST...vW4d",
    displayName: "blockchain_dev",
    avatarUrl: null,
    xp: 7100,
    level: 8,
    coursesCompleted: 3,
    credentials: 1,
  },
  {
    rank: 7,
    wallet: "4nUV...xY5e",
    displayName: "web3_learner",
    avatarUrl: null,
    xp: 6500,
    level: 8,
    coursesCompleted: 3,
    credentials: 1,
  },
  {
    rank: 8,
    wallet: "6tWX...zA6f",
    displayName: "crypto_dev",
    avatarUrl: null,
    xp: 5900,
    level: 7,
    coursesCompleted: 3,
    credentials: 1,
  },
  {
    rank: 9,
    wallet: "1pYZ...bC7g",
    displayName: "sol_newbie",
    avatarUrl: null,
    xp: 4200,
    level: 6,
    coursesCompleted: 2,
    credentials: 1,
  },
  {
    rank: 10,
    wallet: "0qAB...dE8h",
    displayName: "code_monkey",
    avatarUrl: null,
    xp: 3600,
    level: 6,
    coursesCompleted: 2,
    credentials: 1,
  },
];

const MOCK_CREDENTIALS: Credential[] = [
  {
    assetId: "cred_solana_fundamentals",
    name: "Solana Fundamentals Certificate",
    imageUri: "/credentials/solana-fundamentals.png",
    trackId: 1,
    trackLevel: 1,
    coursesCompleted: 1,
    totalXp: 2400,
    mintAddress: "Cred1...xyz",
    collection: "SolFund...abc",
  },
  {
    assetId: "cred_rust_dev",
    name: "Rust Development Certificate",
    imageUri: "/credentials/rust-dev.png",
    trackId: 2,
    trackLevel: 1,
    coursesCompleted: 1,
    totalXp: 3200,
    mintAddress: "Cred2...xyz",
    collection: "RustDev...abc",
  },
];

export const learningProgressService = new MockLearningProgressService();
