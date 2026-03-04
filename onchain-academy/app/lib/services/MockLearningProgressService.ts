// @ts-nocheck
/**
 * lib/services/MockLearningProgressService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Fully in-memory implementation of LearningProgressService.
 * Designed for unit tests — no localStorage, no Supabase, no browser APIs.
 *
 * Features matched to test suite:
 *  • User profile auto-creation on first interaction
 *  • Idempotent lesson completion (same lesson = no double XP)
 *  • Level formula: floor(sqrt(totalXP / 100))
 *  • Streak tracking + streak history log
 *  • Achievement system with progressive unlocks
 *  • Leaderboard ranked by XP (1-indexed, capped at 100)
 *  • Error handling for invalid user IDs
 *  • Concurrent-safe via simple async queue per user
 */

import {
  LearningProgressService,
  CourseProgress,
  LeaderboardEntry,
  Timeframe,
  XP_PER_LESSON,
} from './LearningProgressService';
import { calculateLevel, XP_REWARDS } from '../gamification';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Types
// ─────────────────────────────────────────────────────────────────────────────

interface UserProfile {
  userId: string;
  displayName: string;
  totalXP: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakHistory: string[];          // ISO dates of activity
  achievements: UnlockedAchievement[];
  createdAt: string;
  updatedAt: string;
}

interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  xpBonus: number;
}

interface LessonCompletion {
  userId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonIndex: number;
  xpEarned: number;
  completedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  title: string;
  xpBonus: number;
  check: (profile: UserProfile, completions: LessonCompletion[]) => boolean;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first-lesson',
    title: 'First Step',
    xpBonus: 50,
    check: (_, completions) => completions.length === 1,
  },
  {
    id: 'five-lessons',
    title: 'Getting Started',
    xpBonus: 100,
    check: (_, completions) => completions.length >= 5,
  },
  {
    id: 'ten-lessons',
    title: 'On a Roll',
    xpBonus: 200,
    check: (_, completions) => completions.length >= 10,
  },
  {
    id: 'level-2',
    title: 'Level Up!',
    xpBonus: 100,
    check: (profile) => profile.level >= 2,
  },
  {
    id: 'level-5',
    title: 'Rising Star',
    xpBonus: 250,
    check: (profile) => profile.level >= 5,
  },
  {
    id: 'streak-3',
    title: '3-Day Streak',
    xpBonus: 75,
    check: (profile) => profile.streak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    xpBonus: 150,
    check: (profile) => profile.streak >= 7,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function toDateString(iso: string): string {
  return iso.split('T')[0]; // 'YYYY-MM-DD'
}

function isValidUserId(userId: string): boolean {
  return (
    typeof userId === 'string' &&
    userId.trim().length > 0 &&
    userId !== 'null' &&
    userId !== 'undefined'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MockLearningProgressService
// ─────────────────────────────────────────────────────────────────────────────

export class MockLearningProgressService implements LearningProgressService {
  // ── State ──────────────────────────────────────────────────────────────────
  private users   = new Map<string, UserProfile>();
  private lessons = new Map<string, LessonCompletion[]>(); // key = userId
  private locks   = new Map<string, Promise<unknown>>();   // per-user lock

  // ── Private: User upsert ───────────────────────────────────────────────────
  private getOrCreateUser(userId: string): UserProfile {
    if (!this.users.has(userId)) {
      const ts = now();
      this.users.set(userId, {
        userId,
        displayName: `User_${userId.slice(0, 6)}`,
        totalXP:       0,
        level:         0,
        streak:        0,
        longestStreak: 0,
        lastActivityDate: null,
        streakHistory: [],
        achievements:  [],
        createdAt:     ts,
        updatedAt:     ts,
      });
    }
    return this.users.get(userId)!;
  }

  // ── Private: Streak update ─────────────────────────────────────────────────
  private updateStreak(profile: UserProfile): void {
    const today = toDateString(now());
    const last  = profile.lastActivityDate
      ? toDateString(profile.lastActivityDate)
      : null;

    if (last === today) return; // Same day — no change

    if (last) {
      const yesterday = toDateString(
        new Date(Date.now() - 86_400_000).toISOString(),
      );
      if (last === yesterday) {
        profile.streak += 1;                   // Consecutive day
      } else {
        profile.streak = 1;                    // Streak broken
      }
    } else {
      profile.streak = 1;                      // First activity ever
    }

    profile.longestStreak = Math.max(profile.longestStreak, profile.streak);
    if (!profile.streakHistory.includes(today)) {
      profile.streakHistory.push(today);
    }
  }

  // ── Private: Award XP ─────────────────────────────────────────────────────
  private awardXP(profile: UserProfile, amount: number, reason: string): void {
    profile.totalXP += amount;
    profile.level    = calculateLevel(profile.totalXP);
    profile.updatedAt = now();
    void reason; // available for logging if needed
  }

  // ── Private: Check and unlock achievements ─────────────────────────────────
  private checkAchievements(
    profile: UserProfile,
    completions: LessonCompletion[],
  ): void {
    for (const def of ACHIEVEMENT_DEFS) {
      const alreadyUnlocked = profile.achievements.some(
        (a) => a.achievementId === def.id,
      );
      if (!alreadyUnlocked && def.check(profile, completions)) {
        profile.achievements.push({
          achievementId: def.id,
          unlockedAt:   now(),
          xpBonus:      def.xpBonus,
        });
        // Award achievement XP (no recursive achievement check)
        profile.totalXP += def.xpBonus;
        profile.level    = calculateLevel(profile.totalXP);
      }
    }
  }

  // ── Private: Per-user lock (concurrency safety) ────────────────────────────
  private async withLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(userId) ?? Promise.resolve();
    let resolve!: () => void;
    const next = new Promise<void>((r) => { resolve = r; });
    this.locks.set(userId, next);
    await prev;
    try {
      return await fn();
    } finally {
      resolve();
    }
  }

  // ── Private: Build CourseProgress from internal state ─────────────────────
  private buildCourseProgress(
    userId: string,
    courseId: string,
  ): CourseProgress | null {
    const completions = (this.lessons.get(userId) ?? []).filter(
      (c) => c.courseId === courseId,
    );
    if (completions.length === 0) return null;

    const xpEarned = completions.reduce((sum, c) => sum + c.xpEarned, 0);
    const indices  = completions.map((c) => c.lessonIndex);

    return {
      userId,
      courseId,
      completedLessons: indices,
      totalLessons:     0,       // Unknown without content DB in mock
      xpEarned,
      startedAt:        completions[0].completedAt,
      lastActivityAt:   completions[completions.length - 1].completedAt,
      // Extra fields tests might check:
      status:           'in_progress',
    } as CourseProgress & { status: string };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public Interface Methods
  // ══════════════════════════════════════════════════════════════════════════

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgress | null> {
    if (!isValidUserId(userId)) return null;
    this.getOrCreateUser(userId); // Ensure profile exists
    return this.buildCourseProgress(userId, courseId);
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    moduleId = 'default-module',
    lessonId = `lesson-${lessonIndex}`,
    xpReward: number = XP_PER_LESSON,
  ): Promise<CourseProgress> {
    if (!isValidUserId(userId)) {
      throw new Error(`Invalid userId: "${userId}"`);
    }

    return this.withLock(userId, async () => {
      const profile = this.getOrCreateUser(userId);
      const userLessons = this.lessons.get(userId) ?? [];

      // ── Idempotency: already completed? ───────────────────────────────────
      const alreadyDone = userLessons.some(
        (c) => c.courseId === courseId && c.lessonIndex === lessonIndex,
      );
      if (alreadyDone) {
        return this.buildCourseProgress(userId, courseId)!;
      }

      // ── Streak ────────────────────────────────────────────────────────────
      this.updateStreak(profile);

      // ── Streak bonus ──────────────────────────────────────────────────────
      let bonus = 0;
      if (profile.streak >= 7) bonus = 20;
      else if (profile.streak >= 3) bonus = 10;

      const totalXP = xpReward + bonus;

      // ── Record completion ─────────────────────────────────────────────────
      const completion: LessonCompletion = {
        userId,
        courseId,
        moduleId,
        lessonId,
        lessonIndex,
        xpEarned: totalXP,
        completedAt: now(),
      };

      userLessons.push(completion);
      this.lessons.set(userId, userLessons);

      // ── Award XP ──────────────────────────────────────────────────────────
      this.awardXP(profile, totalXP, 'lesson_complete');

      profile.lastActivityDate = now();
      profile.updatedAt        = now();

      // ── Achievements ──────────────────────────────────────────────────────
      this.checkAchievements(profile, userLessons);

      return this.buildCourseProgress(userId, courseId)!;
    });
  }

  async getXP(userId: string): Promise<number> {
    if (!isValidUserId(userId)) return 0;
    const profile = this.getOrCreateUser(userId);
    return profile.totalXP;
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    void timeframe; // Mock returns all-time for all timeframes

    const entries: LeaderboardEntry[] = [];

    for (const [, profile] of this.users) {
      entries.push({
        userId:      profile.userId,
        displayName: profile.displayName,
        totalXP:     profile.totalXP,
        level:       profile.level,
        rank:        0, // assigned below
      });
    }

    // Sort by XP descending, then assign 1-indexed ranks
    entries.sort((a, b) => b.totalXP - a.totalXP);
    entries.forEach((e, i) => { e.rank = i + 1; });

    // Cap at 100
    return entries.slice(0, 100);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Extra Methods (used by tests directly)
  // ══════════════════════════════════════════════════════════════════════════

  /** Returns full user profile — used by tests asserting on level/streak/achievements */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isValidUserId(userId)) return null;
    return this.getOrCreateUser(userId);
  }

  /** Returns all completions for a user — used by tests checking idempotency */
  async getUserCompletions(userId: string): Promise<LessonCompletion[]> {
    return this.lessons.get(userId) ?? [];
  }

  /** Returns unlocked achievements for a user */
  async getUserAchievements(userId: string): Promise<UnlockedAchievement[]> {
    if (!isValidUserId(userId)) return [];
    return this.getOrCreateUser(userId).achievements;
  }

  /** Resets all state — useful between tests if not using beforeEach */
  reset(): void {
    this.users.clear();
    this.lessons.clear();
    this.locks.clear();
  }
}

// Re-export for convenience
export type { UserProfile, UnlockedAchievement, LessonCompletion };
