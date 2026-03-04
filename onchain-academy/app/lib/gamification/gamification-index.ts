/**
 * lib/gamification/index.ts
 * ─────────────────────────────────────────────────────────────────────────
 * All XP / leveling formulas in one place.
 * Import from here — never inline these calculations in components.
 */

// ── Core Formula ──────────────────────────────────────────────────────────

/**
 * Level = floor( sqrt( totalXP / 100 ) )
 *
 * Guards:
 *  - Negative XP    → level 0  (can't have negative progress)
 *  - NaN / Infinity → level 0
 */
export function calculateLevel(totalXP: number): number {
  if (!Number.isFinite(totalXP) || totalXP < 0) return 0;
  return Math.floor(Math.sqrt(totalXP / 100));
}

/** Minimum XP required to reach `level` */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** XP still needed to reach the next level */
export function xpToNextLevel(totalXP: number): number {
  const level = calculateLevel(totalXP);
  return xpForLevel(level + 1) - Math.max(0, totalXP);
}

/**
 * Progress within the current level (0–1).
 * Useful for progress bars.
 */
export function levelProgress(totalXP: number): number {
  if (!Number.isFinite(totalXP) || totalXP < 0) return 0;
  const level = calculateLevel(totalXP);
  const base   = xpForLevel(level);
  const next   = xpForLevel(level + 1);
  return (totalXP - base) / (next - base);
}

// ── XP rewards ────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  LESSON_COMPLETE:   50,
  QUIZ_PASS:        100,
  COURSE_COMPLETE:  500,
  STREAK_BONUS:      25,
  FIRST_SUBMISSION:  75,
} as const;

// ── Streak helpers ────────────────────────────────────────────────────────
/** Returns true if lastActivity was yesterday (streak intact) */
export function isStreakIntact(lastActivityISO: string): boolean {
  const last  = new Date(lastActivityISO);
  const today = new Date();
  const diff  = Math.floor(
    (today.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0)) / 86_400_000,
  );
  return diff <= 1;
}

// ── Level titles ──────────────────────────────────────────────────────────
const LEVEL_TITLES: Record<number, string> = {
  0: 'Explorer',
  1: 'Apprentice',
  2: 'Builder',
  3: 'Developer',
  4: 'Engineer',
  5: 'Architect',
  6: 'Expert',
  7: 'Master',
  8: 'Legend',
};

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 8)] ?? 'Legend';
}
