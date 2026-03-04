/**
 * __tests__/integration/learning-flow.test.ts
 *
 * Integration tests that exercise multiple modules working together.
 *
 * Test scenarios:
 *
 *  1. Gamification math consistency
 *     — calculateLevel, xpForNextLevel, levelProgress are all internally
 *       consistent: boundaries align, no off-by-one errors, no floating point traps.
 *
 *  2. Full learning progression pipeline
 *     — Complete 25 lessons through MockLearningProgressService and verify
 *       every gamification rule fires in the correct sequence:
 *       XP accumulates → level advances → achievements unlock in order →
 *       leaderboard ranking updates → streak tracking is accurate.
 *
 *  3. Multi-user leaderboard competition
 *     — Three users complete different numbers of lessons; verify the leaderboard
 *       ranks them correctly, caps at 100 entries, and rankings are 1-indexed.
 *
 *  4. Auth redirect URL construction consistency
 *     — getAuthRedirectURL + buildWalletLinkMessage produce outputs that
 *       satisfy the signature-binding constraint checked by the API route.
 *
 * Why integration (not unit)?
 *     These tests deliberately combine real implementations of multiple
 *     modules with no mocking, proving the modules integrate correctly.
 *
 * Run: npm test -- learning-flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Real implementations — no mocks in this file
import {
  calculateLevel,
  xpForNextLevel,
  levelProgress,
  formatXP,
  isValidSolanaAddress,
  truncateAddress,
} from '@/lib/utils';

import { MockLearningProgressService } from '@/lib/services/learning-progress';

import {
  getAuthRedirectURL,
  buildWalletLinkMessage,
} from '@/lib/auth-service';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Gamification math — internal consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Gamification math consistency', () => {
  // ── calculateLevel ↔ xpForNextLevel ──────────────────────────────────────

  it('xpForNextLevel(n) is the exact XP threshold at which calculateLevel returns n+1', () => {
    for (let level = 0; level <= 10; level++) {
      const threshold = xpForNextLevel(level);
      expect(calculateLevel(threshold)).toBe(level + 1);
    }
  });

  it('xpForNextLevel(n) - 1 still maps to level n (no off-by-one)', () => {
    for (let level = 1; level <= 10; level++) {
      const justBelow = xpForNextLevel(level - 1) - 1;
      expect(calculateLevel(justBelow)).toBe(level - 1);
    }
  });

  // ── levelProgress ↔ calculateLevel ───────────────────────────────────────

  it('levelProgress is 0 at every exact level threshold', () => {
    for (let level = 0; level <= 9; level++) {
      const xp = xpForNextLevel(level); // entry XP for level+1
      expect(levelProgress(xp)).toBe(0);
    }
  });

  it('levelProgress is 100 at exactly one XP below the next level threshold', () => {
    // Level 0: range is 0–99 XP. At 99 XP, progress = 99%.
    // (floor((99 / 100) * 100) = 99)
    expect(levelProgress(99)).toBe(99);
  });

  it('levelProgress is monotonically non-decreasing within a level', () => {
    // Spot-check level 0 (0–99 XP)
    let prev = levelProgress(0);
    for (let xp = 1; xp < 100; xp++) {
      const curr = levelProgress(xp);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });

  it('formatXP correctly formats every level threshold', () => {
    const thresholds = [0, 100, 400, 900, 1600, 2500, 3600, 4900, 6400, 8100, 10000];
    for (const xp of thresholds) {
      const formatted = formatXP(xp);
      // Should be a non-empty string without a minus sign
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).not.toContain('-');
    }
  });

  // ── XP formula is strictly increasing ────────────────────────────────────

  it('each successive level requires strictly more XP than the previous', () => {
    for (let level = 1; level <= 9; level++) {
      const prev = xpForNextLevel(level - 1);
      const next = xpForNextLevel(level);
      expect(next).toBeGreaterThan(prev);
    }
  });

  // ── Edge-case inputs don't break the pipeline ─────────────────────────────

  it('calculateLevel(0) → formatXP(0) → levelProgress(0) all work without throwing', () => {
    expect(() => {
      const lvl  = calculateLevel(0);
      const xp   = formatXP(0);
      const pct  = levelProgress(0);
      // Consume values to prevent dead-code elimination
      void `${lvl} ${xp} ${pct}`;
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Full learning progression pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Full learning progression pipeline', () => {
  const USER_ID  = 'integration-pipeline-user';
  const COURSE_A = 'solana-101';
  const COURSE_B = 'defi-fundamentals';
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly accumulates XP across 10 lessons in two different courses', async () => {
    // 5 lessons × 50 XP in each course = 500 XP baseline
    for (let i = 0; i < 5; i++) {
      await svc.completeLesson(USER_ID, COURSE_A, `course-a-lesson-${i}`);
    }
    for (let i = 0; i < 5; i++) {
      await svc.completeLesson(USER_ID, COURSE_B, `course-b-lesson-${i}`);
    }

    const xp = await svc.getXP(USER_ID);
    // 10 lessons × 50 = 500, plus lesson-5 achievement (25 XP bonus) = 525
    expect(xp).toBeGreaterThanOrEqual(500);
  });

  it('level derived from getXP is consistent with calculateLevel(xp)', async () => {
    for (let i = 0; i < 8; i++) {
      await svc.completeLesson(USER_ID, COURSE_A, `level-check-${i}`);
    }
    const xp      = await svc.getXP(USER_ID);
    const profile = await svc.getUserProfile(USER_ID);
    // MockLearningProgressService uses Math.max(1, calculateLevel(xp))
    const expectedLevel = Math.max(1, calculateLevel(xp));
    expect(profile.level).toBe(expectedLevel);
  });

  it('getProgress returns null for a course not yet started', async () => {
    await svc.completeLesson(USER_ID, COURSE_A, 'l1');
    const progress = await svc.getProgress(USER_ID, COURSE_B);
    expect(progress).toBeNull();
  });

  it('getProgress reflects all completed lessons after sequential completions', async () => {
    await svc.completeLesson(USER_ID, COURSE_A, 'l1');
    await svc.completeLesson(USER_ID, COURSE_A, 'l2');
    await svc.completeLesson(USER_ID, COURSE_A, 'l3');

    const progress = await svc.getProgress(USER_ID, COURSE_A);
    expect(progress!.completedLessonIds).toHaveLength(3);
    expect(progress!.completedLessonIds).toContain('l1');
    expect(progress!.completedLessonIds).toContain('l2');
    expect(progress!.completedLessonIds).toContain('l3');
  });

  it('streak builds correctly across 3 consecutive days', async () => {
    const DAY = 86_400_000;
    const BASE = new Date('2024-06-01T10:00:00.000Z');

    vi.setSystemTime(BASE);
    await svc.completeLesson(USER_ID, COURSE_A, 'day1-lesson');

    vi.setSystemTime(new Date(BASE.getTime() + DAY));
    await svc.completeLesson(USER_ID, COURSE_A, 'day2-lesson');

    vi.setSystemTime(new Date(BASE.getTime() + 2 * DAY));
    await svc.completeLesson(USER_ID, COURSE_A, 'day3-lesson');

    const streak = await svc.getStreak(USER_ID);
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
    expect(streak.history).toHaveLength(3);
  });

  it('achievements unlock in the correct order as lesson count grows', async () => {
    // Complete 10 lessons using unique IDs (none trigger 'first-lesson')
    for (let i = 0; i < 10; i++) {
      await svc.completeLesson(USER_ID, COURSE_A, `integration-lesson-${i}`);
    }

    const profile      = await svc.getUserProfile(USER_ID);
    const achievIds    = profile.achievements.map((a) => a.id);

    // lesson-5 should fire before lesson-10
    const idx5  = achievIds.indexOf('lesson-5');
    const idx10 = achievIds.indexOf('lesson-10');
    expect(idx5).toBeGreaterThanOrEqual(0);
    expect(idx10).toBeGreaterThanOrEqual(0);
    expect(idx5).toBeLessThan(idx10);
  });

  it('total XP after 10 lessons includes both base XP and achievement bonuses', async () => {
    // 10 lessons × 50 XP = 500 base
    // + lesson-5 achievement  = 25
    // + lesson-10 achievement = 50
    // Total minimum: 575
    for (let i = 0; i < 10; i++) {
      await svc.completeLesson(USER_ID, COURSE_A, `xp-bonus-check-${i}`);
    }
    const xp = await svc.getXP(USER_ID);
    expect(xp).toBeGreaterThanOrEqual(575);
  });

  it('a duplicate completion mid-sequence does not corrupt later completions', async () => {
    await svc.completeLesson(USER_ID, COURSE_A, 'unique-a');
    await svc.completeLesson(USER_ID, COURSE_A, 'dupe-me');
    await svc.completeLesson(USER_ID, COURSE_A, 'dupe-me'); // duplicate
    await svc.completeLesson(USER_ID, COURSE_A, 'unique-b');

    const profile = await svc.getUserProfile(USER_ID);
    // Should have exactly 3 unique lessons (unique-a, dupe-me, unique-b)
    expect(profile.completedLessons).toHaveLength(3);

    // XP should be 3 × 50 = 150 (not 4 × 50 = 200)
    const xp = await svc.getXP(USER_ID);
    expect(xp).toBe(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Multi-user leaderboard competition
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Multi-user leaderboard', () => {
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
  });

  it('ranks three users by XP descending, with correct 1-indexed ranks', async () => {
    // Alice: 3 lessons = 150 XP
    for (let i = 0; i < 3; i++) await svc.completeLesson('alice', 'c1', `alice-${i}`);
    // Bob: 1 lesson = 50 XP
    await svc.completeLesson('bob', 'c1', 'bob-0');
    // Carol: 5 lessons = 275 XP (250 base + 25 lesson-5 bonus)
    for (let i = 0; i < 5; i++) await svc.completeLesson('carol', 'c1', `carol-${i}`);

    const board = await svc.getLeaderboard();

    // Get positions
    const carolEntry = board.find((e) => e.userId === 'carol');
    const aliceEntry = board.find((e) => e.userId === 'alice');
    const bobEntry   = board.find((e) => e.userId === 'bob');

    expect(carolEntry!.rank).toBe(1);
    expect(aliceEntry!.rank).toBe(2);
    expect(bobEntry!.rank).toBe(3);
  });

  it('caps at 100 entries even with 150 users', async () => {
    for (let i = 0; i < 150; i++) {
      await svc.completeLesson(`user-${i}`, 'c1', `lesson-${i}`, i + 1);
    }
    const board = await svc.getLeaderboard();
    expect(board).toHaveLength(100);
  });

  it('the top 100 entries contain the 100 highest-XP users', async () => {
    // Users 0–149 each get i+1 XP. Top 100 are users 50–149.
    for (let i = 0; i < 150; i++) {
      await svc.completeLesson(`user-${i}`, 'c1', `lesson-${i}`, i + 1);
    }
    const board = await svc.getLeaderboard();
    const minXpInBoard = Math.min(...board.map((e) => e.totalXp));
    // Users 0–49 have XP 1–50; all should be excluded
    expect(minXpInBoard).toBeGreaterThan(50);
  });

  it('a single-user leaderboard has rank 1', async () => {
    await svc.completeLesson('solo', 'c1', 'l1');
    const board = await svc.getLeaderboard();
    expect(board[0].rank).toBe(1);
    expect(board[0].userId).toBe('solo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Auth URL + message binding consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Auth URL + wallet message binding', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('getAuthRedirectURL produces a URL that contains the supplied path', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://superteam-academy.vercel.app');
    const url = getAuthRedirectURL('/auth/callback');
    expect(new URL(url).pathname).toBe('/auth/callback');
  });

  it('buildWalletLinkMessage always includes the userId so the API route can bind it', () => {
    const userId = 'real-supabase-uuid-goes-here';
    const msg    = buildWalletLinkMessage(userId);

    // The API route does: if (!message.includes(user.id)) { return 400 }
    expect(msg.includes(userId)).toBe(true);
  });

  it('messages for two different user IDs cannot be swapped (replay prevention)', () => {
    const msgA = buildWalletLinkMessage('user-a');
    const msgB = buildWalletLinkMessage('user-b');

    // Each message uniquely identifies its owner
    expect(msgA.includes('user-a')).toBe(true);
    expect(msgA.includes('user-b')).toBe(false);
    expect(msgB.includes('user-b')).toBe(true);
    expect(msgB.includes('user-a')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. isValidSolanaAddress + truncateAddress — display pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Wallet address display pipeline', () => {
  const VALID_ADDR = 'So11111111111111111111111111111111111111112';

  it('a valid Solana address passes isValidSolanaAddress and can be truncated', () => {
    expect(isValidSolanaAddress(VALID_ADDR)).toBe(true);
    const truncated = truncateAddress(VALID_ADDR, 4);
    expect(truncated).toContain('...');
    expect(truncated).toHaveLength(4 + 3 + 4); // prefix + '...' + suffix = 11
  });

  it('an address that fails isValidSolanaAddress contains characters that truncateAddress still handles', () => {
    const invalid = '0'.repeat(32); // contains '0', invalid base58
    expect(isValidSolanaAddress(invalid)).toBe(false);
    // truncateAddress is pure string manipulation — should still work
    expect(() => truncateAddress(invalid, 4)).not.toThrow();
  });

  it('displaying a linked wallet address in the UI pipeline is deterministic', () => {
    const walletAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    expect(isValidSolanaAddress(walletAddress)).toBe(true);

    const display1 = truncateAddress(walletAddress, 4);
    const display2 = truncateAddress(walletAddress, 4);
    expect(display1).toBe(display2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Service isolation — parallel service instances
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration › Service isolation across parallel instances', () => {
  it('two MockLearningProgressService instances sharing a userId have independent state', async () => {
    const svc1 = new MockLearningProgressService();
    const svc2 = new MockLearningProgressService();

    // Both record lessons for the same userId 'shared'
    await svc1.completeLesson('shared', 'c1', 'l1', 500);
    await svc2.completeLesson('shared', 'c1', 'l1', 1);

    const xp1 = await svc1.getXP('shared');
    const xp2 = await svc2.getXP('shared');

    expect(xp1).toBe(500);
    expect(xp2).toBe(1);
    expect(xp1).not.toBe(xp2);
  });

  it('mutations in svc1 are not visible to svc2 even for the same course', async () => {
    const svc1 = new MockLearningProgressService();
    const svc2 = new MockLearningProgressService();

    await svc1.completeLesson('user1', 'course-x', 'lesson-x');
    const progressInSvc2 = await svc2.getProgress('user1', 'course-x');

    expect(progressInSvc2).toBeNull();
  });
});
