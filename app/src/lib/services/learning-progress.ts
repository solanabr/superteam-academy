import type { Credential } from '@/lib/solana/credentials';

// ---------------------------------------------------------------------------
// Service return types
// ---------------------------------------------------------------------------

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  isFinalized: boolean;
}

export interface CompletionResult {
  success: boolean;
  xpAwarded: number;
  newTotalXp: number;
  courseProgress: CourseProgress;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezesAvailable: number;
  isFreezeActiveToday: boolean;
}

export interface LeaderboardEntry {
  wallet: string;
  xpBalance: number;
  level: number;
  rank: number;
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface LearningProgressService {
  getProgressForUserCourse(userId: string, courseId: string): Promise<CourseProgress>;
  completeLesson(userId: string, courseId: string, lessonId: string): Promise<CompletionResult>;
  getXPBalance(walletAddress: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboardEntries(
    timeframe: 'weekly' | 'monthly' | 'all_time',
    courseId?: string,
  ): Promise<LeaderboardEntry[]>;
  getCredentialsForWallet(walletAddress: string): Promise<Credential[]>;
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

const MOCK_WALLETS = [
  '7xKJ...mock1',
  '9aBc...mock2',
  '3dEf...mock3',
  '5gHi...mock4',
  '2jKl...mock5',
] as const;

const MOCK_COURSES: Record<string, CourseProgress> = {
  'intro-to-solana': {
    courseId: 'intro-to-solana',
    completedLessons: 5,
    totalLessons: 8,
    progressPercent: 62.5,
    isFinalized: false,
  },
  'anchor-fundamentals': {
    courseId: 'anchor-fundamentals',
    completedLessons: 12,
    totalLessons: 12,
    progressPercent: 100,
    isFinalized: true,
  },
  'token-extensions': {
    courseId: 'token-extensions',
    completedLessons: 0,
    totalLessons: 6,
    progressPercent: 0,
    isFinalized: false,
  },
};

export class MockLearningProgressService implements LearningProgressService {
  async getProgressForUserCourse(
    _userId: string,
    courseId: string,
  ): Promise<CourseProgress> {
    const progress = MOCK_COURSES[courseId];
    if (progress) return progress;

    return {
      courseId,
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
      isFinalized: false,
    };
  }

  async completeLesson(
    _userId: string,
    courseId: string,
    _lessonId: string,
  ): Promise<CompletionResult> {
    const existing = MOCK_COURSES[courseId];
    const completed = (existing?.completedLessons ?? 0) + 1;
    const total = existing?.totalLessons ?? 10;

    const courseProgress: CourseProgress = {
      courseId,
      completedLessons: completed,
      totalLessons: total,
      progressPercent: total > 0 ? (completed / total) * 100 : 0,
      isFinalized: completed >= total,
    };

    return {
      success: true,
      xpAwarded: 25,
      newTotalXp: 1275,
      courseProgress,
    };
  }

  async getXPBalance(_walletAddress: string): Promise<number> {
    return 1250;
  }

  async getStreakData(_userId: string): Promise<StreakData> {
    return {
      currentStreak: 12,
      longestStreak: 34,
      lastActiveDate: new Date().toISOString().split('T')[0] ?? null,
      freezesAvailable: 2,
      isFreezeActiveToday: false,
    };
  }

  async getLeaderboardEntries(
    _timeframe: 'weekly' | 'monthly' | 'all_time',
    _courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    return MOCK_WALLETS.map((wallet, index) => ({
      wallet,
      xpBalance: 5000 - index * 750,
      level: 7 - index,
      rank: index + 1,
    }));
  }

  async getCredentialsForWallet(_walletAddress: string): Promise<Credential[]> {
    return [
      {
        assetId: 'mock-credential-001',
        name: 'Solana Foundations Certificate',
        uri: 'https://arweave.net/mock-uri-001',
        imageUrl: 'https://arweave.net/mock-image-001',
        owner: _walletAddress,
        collection: 'superteam-academy-v1',
        frozen: false,
        attributes: {
          trackId: 1,
          level: 3,
          coursesCompleted: 4,
          totalXp: 2400,
        },
        createdAt: '2026-01-15T10:30:00Z',
      },
      {
        assetId: 'mock-credential-002',
        name: 'Anchor Developer Certificate',
        uri: 'https://arweave.net/mock-uri-002',
        imageUrl: 'https://arweave.net/mock-image-002',
        owner: _walletAddress,
        collection: 'superteam-academy-v1',
        frozen: false,
        attributes: {
          trackId: 2,
          level: 5,
          coursesCompleted: 6,
          totalXp: 4800,
        },
        createdAt: '2026-02-10T14:00:00Z',
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a LearningProgressService instance.
 * Swap with on-chain implementation when IDL integration is complete.
 */
export function createLearningProgressService(): LearningProgressService {
  return new MockLearningProgressService();
}
