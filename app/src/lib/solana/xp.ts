/**
 * Derives the current level from a raw XP amount.
 * Level = floor(sqrt(xp / 100)), so level 1 starts at 100 XP,
 * level 2 at 400 XP, level 3 at 900 XP, etc.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Returns the minimum XP required to reach the given level.
 * Inverse of calculateLevel: level^2 * 100.
 */
export function calculateXpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Returns the 50% completion bonus awarded by finalize_course.
 * The bonus equals half of the total XP that would be earned from lessons.
 */
export function calculateBonusXp(
  lessonCount: number,
  xpPerLesson: number
): number {
  return Math.floor((lessonCount * xpPerLesson) / 2);
}

/**
 * Formats an XP value with thousands separators (e.g. 12500 → "12,500").
 */
export function formatXp(xp: number): string {
  return xp.toLocaleString("en-US");
}
