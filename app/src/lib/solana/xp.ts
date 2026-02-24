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
