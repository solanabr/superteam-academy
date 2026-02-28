// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  hasAchievement,
  getUserAchievements,
  evaluateAchievementCondition,
} from '../achievements';
import { achievementReceiptPda } from '../pda';

// Mock Connection
const mockGetAccountInfo = vi.fn();
const mockGetMultipleAccountsInfo = vi.fn();

const mockConnection = {
  getAccountInfo: mockGetAccountInfo,
  getMultipleAccountsInfo: mockGetMultipleAccountsInfo,
} as unknown as Connection;

const recipient = new PublicKey('11111111111111111111111111111112');

/** Minimal non-null account info to simulate an existing receipt. */
const existingAccountInfo = {
  data: Buffer.alloc(49),
  executable: false,
  lamports: 1_000_000,
  owner: new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'),
  rentEpoch: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── hasAchievement ─────────────────────────────────────────────────────────

describe('hasAchievement', () => {
  it('returns true when receipt account exists', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(existingAccountInfo);
    const result = await hasAchievement(mockConnection, 'first-course', recipient);
    expect(result).toBe(true);
  });

  it('returns false when receipt account is null', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    const result = await hasAchievement(mockConnection, 'first-course', recipient);
    expect(result).toBe(false);
  });

  it('queries the correct PDA address', async () => {
    mockGetAccountInfo.mockResolvedValueOnce(null);
    await hasAchievement(mockConnection, 'streak-7', recipient);

    const [expectedPda] = achievementReceiptPda('streak-7', recipient);
    expect(mockGetAccountInfo).toHaveBeenCalledWith(expectedPda);
  });
});

// ─── getUserAchievements ────────────────────────────────────────────────────

describe('getUserAchievements', () => {
  const knownIds = ['first-course', 'streak-7', 'xp-1000'];

  it('batch fetches all achievement receipts in one call', async () => {
    mockGetMultipleAccountsInfo.mockResolvedValueOnce([
      existingAccountInfo,
      null,
      existingAccountInfo,
    ]);

    await getUserAchievements(mockConnection, recipient, knownIds);

    expect(mockGetMultipleAccountsInfo).toHaveBeenCalledTimes(1);

    // Verify correct PDAs were passed
    const expectedPdas = knownIds.map((id) => {
      const [pda] = achievementReceiptPda(id, recipient);
      return pda;
    });
    expect(mockGetMultipleAccountsInfo).toHaveBeenCalledWith(expectedPdas);
  });

  it('correctly maps earned/not-earned status', async () => {
    mockGetMultipleAccountsInfo.mockResolvedValueOnce([
      existingAccountInfo,
      null,
      existingAccountInfo,
    ]);

    const results = await getUserAchievements(mockConnection, recipient, knownIds);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ achievementId: 'first-course', earned: true });
    expect(results[1]).toEqual({ achievementId: 'streak-7', earned: false });
    expect(results[2]).toEqual({ achievementId: 'xp-1000', earned: true });
  });

  it('handles all-null (no achievements earned)', async () => {
    mockGetMultipleAccountsInfo.mockResolvedValueOnce([null, null, null]);

    const results = await getUserAchievements(mockConnection, recipient, knownIds);

    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.earned).toBe(false);
    }
  });

  it('handles empty knownAchievementIds array', async () => {
    mockGetMultipleAccountsInfo.mockResolvedValueOnce([]);

    const results = await getUserAchievements(mockConnection, recipient, []);
    expect(results).toEqual([]);
    expect(mockGetMultipleAccountsInfo).toHaveBeenCalledWith([]);
  });
});

// ─── evaluateAchievementCondition ───────────────────────────────────────────

describe('evaluateAchievementCondition', () => {
  describe('courses_completed', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'courses_completed', value: 3 },
        { coursesCompleted: 5 },
      );
      expect(result).toBe(true);
    });

    it('returns true when exactly equal', () => {
      const result = evaluateAchievementCondition(
        { type: 'courses_completed', value: 3 },
        { coursesCompleted: 3 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'courses_completed', value: 3 },
        { coursesCompleted: 2 },
      );
      expect(result).toBe(false);
    });
  });

  describe('streak_days', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'streak_days', value: 7 },
        { streakDays: 10 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'streak_days', value: 7 },
        { streakDays: 3 },
      );
      expect(result).toBe(false);
    });
  });

  describe('challenges_completed', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'challenges_completed', value: 5 },
        { challengesCompleted: 5 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'challenges_completed', value: 5 },
        { challengesCompleted: 4 },
      );
      expect(result).toBe(false);
    });
  });

  describe('forum_answers', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'forum_answers', value: 10 },
        { forumAnswersAccepted: 15 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'forum_answers', value: 10 },
        { forumAnswersAccepted: 9 },
      );
      expect(result).toBe(false);
    });
  });

  describe('total_xp', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'total_xp', value: 1000 },
        { totalXp: 1500 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'total_xp', value: 1000 },
        { totalXp: 500 },
      );
      expect(result).toBe(false);
    });
  });

  describe('lessons_completed', () => {
    it('returns true when condition met', () => {
      const result = evaluateAchievementCondition(
        { type: 'lessons_completed', value: 20 },
        { lessonsCompleted: 25 },
      );
      expect(result).toBe(true);
    });

    it('returns false when condition not met', () => {
      const result = evaluateAchievementCondition(
        { type: 'lessons_completed', value: 20 },
        { lessonsCompleted: 19 },
      );
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for unknown condition type', () => {
      const result = evaluateAchievementCondition(
        { type: 'nonexistent_type', value: 1 },
        { coursesCompleted: 100 },
      );
      expect(result).toBe(false);
    });

    it('uses 0 default when context field is missing', () => {
      const result = evaluateAchievementCondition(
        { type: 'courses_completed', value: 1 },
        {},
      );
      expect(result).toBe(false);
    });

    it('uses 0 default when context field is undefined', () => {
      const result = evaluateAchievementCondition(
        { type: 'streak_days', value: 1 },
        { streakDays: undefined },
      );
      expect(result).toBe(false);
    });

    it('returns true when condition value is 0', () => {
      const result = evaluateAchievementCondition(
        { type: 'total_xp', value: 0 },
        {},
      );
      expect(result).toBe(true);
    });
  });
});
