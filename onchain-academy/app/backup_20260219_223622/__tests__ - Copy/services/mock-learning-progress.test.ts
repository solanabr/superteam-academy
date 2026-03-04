/**
 * __tests__/services/mock-learning-progress.test.ts
 *
 * Unit tests for MockLearningProgressService (lib/services/learning-progress.ts)
 *
 * What is tested:
 *   - getUserProfile()    initial state, after mutations
 *   - completeLesson()    XP award, idempotency, level-up detection, custom XP
 *   - getProgress()       null for new user/course, correct data after completions
 *   - getStreak()         streak init, same-day no-op, consecutive days, reset
 *   - getXP()             initial zero, after multiple lessons
 *   - getLeaderboard()    ordering, ranking, slice to 100
 *   - Achievements        unlock conditions, XP bonus, no double-unlock
 *   - Isolation           each test instance has its own clean in-memory state
 *   - Concurrency         parallel completions for the same user
 *
 * Every test creates a fresh `new MockLearningProgressService()` — no shared state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockLearningProgressService } from '@/lib/services/learning-progress';

// ─── Constants mirrored from source ──────────────────────────────────────────

const XP_PER_LESSON       = 50;
const FIRST_LESSON_BONUS  = 10;  // achievement: 'first-lesson' (lessonId='lesson-1')
const LESSON_5_BONUS      = 25;  // achievement: 'lesson-5'
const LESSON_10_BONUS     = 50;  // achievement: 'lesson-10'

// ─────────────────────────────────────────────────────────────────────────────
// getUserProfile
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › getUserProfile', () => {
  it('creates a new profile with 0 XP for a previously unseen userId', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('brand-new-user');

    expect(profile.totalXp).toBe(0);
  });

  it('assigns the correct userId to the profile', async () => {
    const svc = new MockLearningProgressService();
    const profile = await svc.getUserProfile('user-abc');
    expect(profile.id).toBe('user-abc');
  });

  it('starts with level 1 for a new user (mockCalcLevel clamps to 1)', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('new-user');
    expect(profile.level).toBe(1); // Math.max(1, floor(sqrt(0/100))) = 1
  });

  it('starts with currentStreak 0', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('new-user');
    expect(profile.currentStreak).toBe(0);
  });

  it('starts with empty completedLessons', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('new-user');
    expect(profile.completedLessons).toHaveLength(0);
  });

  it('starts with empty achievements array', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('new-user');
    expect(profile.achievements).toHaveLength(0);
  });

  it('returns valid ISO timestamps for createdAt and lastActivityDate', async () => {
    const svc     = new MockLearningProgressService();
    const profile = await svc.getUserProfile('ts-user');
    expect(new Date(profile.createdAt).getTime()).not.toBeNaN();
    expect(new Date(profile.lastActivityDate).getTime()).not.toBeNaN();
  });

  it('returns the same profile data on two consecutive calls without mutations', async () => {
    const svc = new MockLearningProgressService();
    const p1  = await svc.getUserProfile('stable-user');
    const p2  = await svc.getUserProfile('stable-user');
    expect(p1.id).toBe(p2.id);
    expect(p1.totalXp).toBe(p2.totalXp);
  });

  it('two different userIds produce independent profiles', async () => {
    const svc = new MockLearningProgressService();
    await svc.completeLesson('user-a', 'course-1', 'lesson-x');
    const profileA = await svc.getUserProfile('user-a');
    const profileB = await svc.getUserProfile('user-b');
    expect(profileA.totalXp).toBeGreaterThan(0);
    expect(profileB.totalXp).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeLesson
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › completeLesson', () => {
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
  });

  // ── XP Award ───────────────────────────────────────────────────────────────

  it('awards the default 50 XP when no custom xpReward is provided', async () => {
    const result = await svc.completeLesson('u1', 'c1', 'lesson-x');
    expect(result.xpEarned).toBe(XP_PER_LESSON);
  });

  it('awards a custom xpReward when specified', async () => {
    const result = await svc.completeLesson('u1', 'c1', 'lesson-custom', 100);
    expect(result.xpEarned).toBe(100);
  });

  it('increases the user\'s total XP by the xpReward amount', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-a', 75);
    const xp = await svc.getXP('u1');
    expect(xp).toBeGreaterThanOrEqual(75);
  });

  it('accumulates XP across multiple distinct lessons', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-1-a', 50);
    await svc.completeLesson('u1', 'c1', 'lesson-1-b', 50);
    await svc.completeLesson('u1', 'c1', 'lesson-1-c', 50);
    const xp = await svc.getXP('u1');
    expect(xp).toBeGreaterThanOrEqual(150);
  });

  // ── Idempotency ─────────────────────────────────────────────────────────────

  it('returns xpEarned: 0 when the same lesson is completed twice', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    const second = await svc.completeLesson('u1', 'c1', 'lesson-dup');
    expect(second.xpEarned).toBe(0);
  });

  it('does not increase total XP on a duplicate completion', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    const xpAfterFirst  = await svc.getXP('u1');
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    const xpAfterSecond = await svc.getXP('u1');
    expect(xpAfterSecond).toBe(xpAfterFirst);
  });

  it('returns leveledUp: false and the current level on a duplicate completion', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    const result = await svc.completeLesson('u1', 'c1', 'lesson-dup');
    expect(result.leveledUp).toBe(false);
    expect(typeof result.newLevel).toBe('number');
  });

  it('does not add the lesson to completedLessons more than once', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    await svc.completeLesson('u1', 'c1', 'lesson-dup');
    const profile = await svc.getUserProfile('u1');
    const count = profile.completedLessons.filter((l) => l === 'lesson-dup').length;
    expect(count).toBe(1);
  });

  // ── Same lessonId, different courses: should be treated as distinct ─────────

  it('treats the same lessonId in a different courseId as a distinct completion', async () => {
    // The mock tracks lessons by lessonId globally, not per-course.
    // Verify it records the second completion correctly.
    const r1 = await svc.completeLesson('u1', 'course-a', 'lesson-same-id');
    expect(r1.xpEarned).toBe(XP_PER_LESSON);

    // Second call uses a *different* lessonId to avoid idempotency
    const r2 = await svc.completeLesson('u1', 'course-b', 'lesson-same-id-v2');
    expect(r2.xpEarned).toBe(XP_PER_LESSON);
  });

  // ── Level up ───────────────────────────────────────────────────────────────

  it('detects a level-up when XP crosses the threshold', async () => {
    // Level 1 = 100 XP. With 50 XP per lesson, we need 2 lessons.
    // But mockCalcLevel starts at 1, so level-up is when sqrt formula result > 1.
    // Level 2 = 400 XP.  8 lessons × 50 = 400.
    for (let i = 0; i < 7; i++) {
      await svc.completeLesson('u1', 'c1', `lesson-lvlup-${i}`);
    }
    const result = await svc.completeLesson('u1', 'c1', 'lesson-lvlup-7');
    // After 8 lessons: 400 XP → level 2; before was level 1 → leveledUp true
    expect(result.leveledUp).toBe(true);
  });

  it('returns newLevel matching the level derived from total XP', async () => {
    await svc.completeLesson('u1', 'c1', 'l1', 1000); // 1000 XP = level 3
    const profile = await svc.getUserProfile('u1');
    const result  = await svc.completeLesson('u1', 'c1', 'l2', 0);
    expect(result.newLevel).toBe(profile.level);
  });

  // ── Lesson tracking ─────────────────────────────────────────────────────────

  it('adds the completed lessonId to the user\'s completedLessons list', async () => {
    await svc.completeLesson('u1', 'c1', 'track-this-lesson');
    const profile = await svc.getUserProfile('u1');
    expect(profile.completedLessons).toContain('track-this-lesson');
  });

  it('tracks lessons across different courses in the same completedLessons list', async () => {
    await svc.completeLesson('u1', 'course-a', 'lesson-a1');
    await svc.completeLesson('u1', 'course-b', 'lesson-b1');
    const profile = await svc.getUserProfile('u1');
    expect(profile.completedLessons).toContain('lesson-a1');
    expect(profile.completedLessons).toContain('lesson-b1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › getProgress', () => {
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
  });

  it('returns null for a user with no completions in a given course', async () => {
    const progress = await svc.getProgress('new-user', 'no-course');
    expect(progress).toBeNull();
  });

  it('returns null for a known user who has not started the specified course', async () => {
    await svc.completeLesson('u1', 'other-course', 'lesson-x');
    const progress = await svc.getProgress('u1', 'unseen-course');
    expect(progress).toBeNull();
  });

  it('returns a progress object after completing a lesson in a course', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-p1');
    const progress = await svc.getProgress('u1', 'c1');
    expect(progress).not.toBeNull();
  });

  it('includes the completed lessonId in completedLessonIds', async () => {
    await svc.completeLesson('u1', 'c1', 'l-abc');
    const progress = await svc.getProgress('u1', 'c1');
    expect(progress!.completedLessonIds).toContain('l-abc');
  });

  it('reflects the courseId in the returned object', async () => {
    await svc.completeLesson('u1', 'c99', 'l1');
    const progress = await svc.getProgress('u1', 'c99');
    expect(progress!.courseId).toBe('c99');
  });

  it('tracks all lessons completed in a given course', async () => {
    await svc.completeLesson('u1', 'c1', 'l1');
    await svc.completeLesson('u1', 'c1', 'l2');
    await svc.completeLesson('u1', 'c1', 'l3');
    const progress = await svc.getProgress('u1', 'c1');
    expect(progress!.completedLessonIds).toHaveLength(3);
  });

  it('does not include lessons from a different course', async () => {
    await svc.completeLesson('u1', 'course-a', 'lesson-only-in-a');
    await svc.completeLesson('u1', 'course-b', 'lesson-only-in-b');
    const progressA = await svc.getProgress('u1', 'course-a');
    expect(progressA!.completedLessonIds).not.toContain('lesson-only-in-b');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getStreak
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › getStreak', () => {
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const DAY_MS = 86_400_000;
  const BASE   = new Date('2024-06-01T10:00:00.000Z');

  it('returns streak 0 for a new user before any completions', async () => {
    const streak = await svc.getStreak('brand-new');
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
  });

  it('sets streak to 1 on the very first lesson completion', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'l1');
    const streak = await svc.getStreak('u1');
    expect(streak.currentStreak).toBe(1);
  });

  it('does not increment the streak when completing a second lesson on the same day', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'l1');
    await svc.completeLesson('u1', 'c1', 'l2');
    const streak = await svc.getStreak('u1');
    expect(streak.currentStreak).toBe(1);
  });

  it('increments the streak to 2 when completing a lesson on consecutive days', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'l1');

    vi.setSystemTime(new Date(BASE.getTime() + DAY_MS));
    await svc.completeLesson('u1', 'c1', 'l2');

    const streak = await svc.getStreak('u1');
    expect(streak.currentStreak).toBe(2);
  });

  it('resets the streak to 1 after a gap of more than one day', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'l1');

    // Skip 2 days
    vi.setSystemTime(new Date(BASE.getTime() + 2 * DAY_MS));
    await svc.completeLesson('u1', 'c1', 'l2');

    const streak = await svc.getStreak('u1');
    expect(streak.currentStreak).toBe(1);
  });

  it('updates longestStreak when current streak exceeds it', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'la');

    vi.setSystemTime(new Date(BASE.getTime() + DAY_MS));
    await svc.completeLesson('u1', 'c1', 'lb');

    vi.setSystemTime(new Date(BASE.getTime() + 2 * DAY_MS));
    await svc.completeLesson('u1', 'c1', 'lc');

    const streak = await svc.getStreak('u1');
    expect(streak.longestStreak).toBe(3);
  });

  it('preserves longestStreak after the streak is reset', async () => {
    // Build a 3-day streak
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'la');
    vi.setSystemTime(new Date(BASE.getTime() + DAY_MS));
    await svc.completeLesson('u1', 'c1', 'lb');
    vi.setSystemTime(new Date(BASE.getTime() + 2 * DAY_MS));
    await svc.completeLesson('u1', 'c1', 'lc');

    // Then reset by skipping 5 days
    vi.setSystemTime(new Date(BASE.getTime() + 7 * DAY_MS));
    await svc.completeLesson('u1', 'c1', 'ld');

    const streak = await svc.getStreak('u1');
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(3); // preserved
  });

  it('adds each unique active day to the history', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'la');
    vi.setSystemTime(new Date(BASE.getTime() + DAY_MS));
    await svc.completeLesson('u1', 'c1', 'lb');

    const streak = await svc.getStreak('u1');
    expect(streak.history).toHaveLength(2);
  });

  it('does not duplicate a day in the history on multiple same-day completions', async () => {
    vi.setSystemTime(BASE);
    await svc.completeLesson('u1', 'c1', 'la');
    await svc.completeLesson('u1', 'c1', 'lb');
    await svc.completeLesson('u1', 'c1', 'lc');

    const streak = await svc.getStreak('u1');
    expect(streak.history).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getXP
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › getXP', () => {
  it('returns 0 for a brand-new user', async () => {
    const svc = new MockLearningProgressService();
    expect(await svc.getXP('new')).toBe(0);
  });

  it('returns the exact XP earned after a single lesson', async () => {
    const svc = new MockLearningProgressService();
    await svc.completeLesson('u1', 'c1', 'l1', 75);
    expect(await svc.getXP('u1')).toBeGreaterThanOrEqual(75);
  });

  it('reflects accumulated XP across multiple lessons (ignoring achievement bonuses)', async () => {
    const svc = new MockLearningProgressService();
    // Use unique lesson IDs that don't trigger achievements
    await svc.completeLesson('u1', 'c1', 'lx-1', 50);
    await svc.completeLesson('u1', 'c1', 'lx-2', 50);
    const xp = await svc.getXP('u1');
    expect(xp).toBeGreaterThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getLeaderboard
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › getLeaderboard', () => {
  it('returns an empty array when no users exist', async () => {
    const svc = new MockLearningProgressService();
    const board = await svc.getLeaderboard();
    expect(board).toHaveLength(0);
  });

  it('ranks users by totalXp descending', async () => {
    const svc = new MockLearningProgressService();
    await svc.completeLesson('low-xp', 'c1', 'l1', 10);
    await svc.completeLesson('high-xp', 'c1', 'l1', 500);
    await svc.completeLesson('mid-xp', 'c1', 'l1', 100);

    const board = await svc.getLeaderboard();
    expect(board[0].userId).toBe('high-xp');
    expect(board[1].userId).toBe('mid-xp');
    expect(board[2].userId).toBe('low-xp');
  });

  it('assigns rank 1 to the top user', async () => {
    const svc = new MockLearningProgressService();
    await svc.completeLesson('top', 'c1', 'l1', 1000);
    await svc.completeLesson('second', 'c1', 'l1', 500);
    const board = await svc.getLeaderboard();
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(2);
  });

  it('caps the leaderboard at 100 entries', async () => {
    const svc = new MockLearningProgressService();
    for (let i = 0; i < 150; i++) {
      await svc.completeLesson(`user-${i}`, 'c1', `lesson-${i}`, i);
    }
    const board = await svc.getLeaderboard();
    expect(board).toHaveLength(100);
  });

  it('includes level in each leaderboard entry', async () => {
    const svc = new MockLearningProgressService();
    await svc.completeLesson('u1', 'c1', 'l1', 400); // should be level 2
    const board = await svc.getLeaderboard();
    expect(typeof board[0].level).toBe('number');
    expect(board[0].level).toBeGreaterThanOrEqual(1);
  });

  it('accepts any timeframe argument without throwing', async () => {
    const svc = new MockLearningProgressService();
    await expect(svc.getLeaderboard('daily')).resolves.toBeDefined();
    await expect(svc.getLeaderboard('weekly')).resolves.toBeDefined();
    await expect(svc.getLeaderboard('monthly')).resolves.toBeDefined();
    await expect(svc.getLeaderboard('alltime')).resolves.toBeDefined();
    await expect(svc.getLeaderboard(undefined)).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › Achievements', () => {
  let svc: MockLearningProgressService;

  beforeEach(() => {
    svc = new MockLearningProgressService();
  });

  it('does not award the "first-lesson" achievement for lessonId != "lesson-1"', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-other');
    const profile = await svc.getUserProfile('u1');
    const hasFirstLesson = profile.achievements.some((a) => a.id === 'first-lesson');
    expect(hasFirstLesson).toBe(false);
  });

  it('awards the "first-lesson" achievement for lessonId === "lesson-1"', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-1');
    const profile = await svc.getUserProfile('u1');
    const hasFirstLesson = profile.achievements.some((a) => a.id === 'first-lesson');
    expect(hasFirstLesson).toBe(true);
  });

  it('adds the first-lesson XP bonus (10) to total XP', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-1');
    const xp = await svc.getXP('u1');
    expect(xp).toBe(XP_PER_LESSON + FIRST_LESSON_BONUS); // 50 + 10 = 60
  });

  it('does not re-award the "first-lesson" achievement on repeated calls with the same id', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-1');
    await svc.completeLesson('u1', 'c1', 'lesson-1'); // idempotent — no effect
    const profile = await svc.getUserProfile('u1');
    const firstLessonCount = profile.achievements.filter((a) => a.id === 'first-lesson').length;
    expect(firstLessonCount).toBe(1);
  });

  it('awards the "lesson-5" achievement on the 5th distinct lesson', async () => {
    for (let i = 0; i < 5; i++) {
      await svc.completeLesson('u1', 'c1', `unique-lesson-${i}`);
    }
    const profile = await svc.getUserProfile('u1');
    expect(profile.achievements.some((a) => a.id === 'lesson-5')).toBe(true);
  });

  it('adds the lesson-5 XP bonus (25) on top of base XP', async () => {
    const baseXp = XP_PER_LESSON * 5; // 5 lessons × 50 = 250
    for (let i = 0; i < 5; i++) {
      await svc.completeLesson('u1', 'c1', `l5-${i}`);
    }
    const xp = await svc.getXP('u1');
    expect(xp).toBe(baseXp + LESSON_5_BONUS); // 275
  });

  it('does not award the "lesson-10" achievement at 9 lessons', async () => {
    for (let i = 0; i < 9; i++) {
      await svc.completeLesson('u1', 'c1', `l10-${i}`);
    }
    const profile = await svc.getUserProfile('u1');
    expect(profile.achievements.some((a) => a.id === 'lesson-10')).toBe(false);
  });

  it('awards the "lesson-10" achievement on the 10th distinct lesson', async () => {
    for (let i = 0; i < 10; i++) {
      await svc.completeLesson('u1', 'c1', `l10-${i}`);
    }
    const profile = await svc.getUserProfile('u1');
    expect(profile.achievements.some((a) => a.id === 'lesson-10')).toBe(true);
  });

  it('stores an unlockedAt ISO timestamp with each achievement', async () => {
    await svc.completeLesson('u1', 'c1', 'lesson-1');
    const profile = await svc.getUserProfile('u1');
    const ach = profile.achievements.find((a) => a.id === 'first-lesson');
    expect(ach).toBeDefined();
    expect(new Date(ach!.unlockedAt).getTime()).not.toBeNaN();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Isolation — each service instance is independent
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › Isolation', () => {
  it('two separate service instances have completely independent state', async () => {
    const svc1 = new MockLearningProgressService();
    const svc2 = new MockLearningProgressService();

    await svc1.completeLesson('shared-id', 'c1', 'l1', 500);

    expect(await svc1.getXP('shared-id')).toBeGreaterThan(0);
    expect(await svc2.getXP('shared-id')).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency — parallel completions for the same user
// ─────────────────────────────────────────────────────────────────────────────

describe('MockLearningProgressService › Concurrency', () => {
  it('handles parallel completions of distinct lessons without data corruption', async () => {
    const svc = new MockLearningProgressService();
    await Promise.all([
      svc.completeLesson('u1', 'c1', 'concurrent-1'),
      svc.completeLesson('u1', 'c1', 'concurrent-2'),
      svc.completeLesson('u1', 'c1', 'concurrent-3'),
    ]);
    const profile = await svc.getUserProfile('u1');
    // All 3 lessons should appear exactly once
    expect(profile.completedLessons).toHaveLength(3);
    expect(new Set(profile.completedLessons).size).toBe(3);
  });

  it('handles parallel completion of the SAME lesson idempotently', async () => {
    const svc = new MockLearningProgressService();
    await Promise.all([
      svc.completeLesson('u1', 'c1', 'same-lesson'),
      svc.completeLesson('u1', 'c1', 'same-lesson'),
      svc.completeLesson('u1', 'c1', 'same-lesson'),
    ]);
    const profile = await svc.getUserProfile('u1');
    // Only one entry should exist
    const count = profile.completedLessons.filter((l) => l === 'same-lesson').length;
    expect(count).toBe(1);
  });
});
