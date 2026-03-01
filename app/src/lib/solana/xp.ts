// ---------------------------------------------------------------------------
// XP Reward Configuration
// ---------------------------------------------------------------------------

/** Difficulty tiers matching the CMS course/challenge schema. */
export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';

interface DifficultyReward {
  base: number;
  byDifficulty: Record<DifficultyTier, number>;
}

/**
 * Canonical XP reward table. All reward amounts flow from this single config
 * so they can be tuned without hunting through multiple files.
 */
export const XP_REWARDS = {
  lessonComplete: { base: 25, byDifficulty: { beginner: 10, intermediate: 25, advanced: 50 } },
  challengeComplete: { base: 50, byDifficulty: { beginner: 25, intermediate: 50, advanced: 100 } },
  courseComplete: { base: 1000, byDifficulty: { beginner: 500, intermediate: 1000, advanced: 2000 } },
  dailyStreak: 10,
  firstCompletionOfDay: 25,
} as const;

/** Reward types that support per-difficulty scaling. */
export type XpRewardType = keyof typeof XP_REWARDS;

/**
 * Resolve the XP amount for a given reward type and optional difficulty.
 *
 * - For flat rewards (`dailyStreak`, `firstCompletionOfDay`) the difficulty
 *   parameter is ignored and the flat value is returned.
 * - For tiered rewards (`lessonComplete`, `challengeComplete`, `courseComplete`)
 *   the difficulty selects the scaled amount; if omitted, the base value is used.
 */
export function getXpReward(type: XpRewardType, difficulty?: DifficultyTier): number {
  const entry = XP_REWARDS[type];

  // Flat reward — just a number
  if (typeof entry === 'number') {
    return entry;
  }

  // Tiered reward — look up by difficulty or fall back to base
  const tiered = entry as DifficultyReward;
  if (difficulty && difficulty in tiered.byDifficulty) {
    return tiered.byDifficulty[difficulty];
  }
  return tiered.base;
}

// ---------------------------------------------------------------------------
// Level Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate level from raw XP. Formula: floor(sqrt(xp / 100)).
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Get the minimum XP required to reach a given level.
 * Inverse of calculateLevel: level^2 * 100.
 */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * XP remaining until the next level.
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

/**
 * Progress percentage (0-100) within the current level bracket.
 */
export function xpProgressPercent(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  if (nextLevelXp === currentLevelXp) return 100;
  return ((currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

export const LEVEL_TITLES = [
  'Newcomer', 'Explorer', 'Builder', 'Developer', 'Engineer',
  'Architect', 'Specialist', 'Expert', 'Master', 'Grandmaster', 'Legend',
] as const;

/**
 * Get human-readable title for a level. Clamps to max defined title.
 */
export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] ?? 'Legend';
}
