/**
 * Level from XP per spec: Level = floor(sqrt(xp / 100))
 * e.g. xp=100 -> 1, xp=400 -> 2, xp=900 -> 3
 */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 100));
}

export interface XpProgressInLevel {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
}

/**
 * XP progress within current level for progress bar.
 * xpAtLevelStart = level^2 * 100, xpForNextLevel = (level+1)^2 * 100 - level^2 * 100
 */
export function xpProgressInLevel(xp: number): XpProgressInLevel {
  const level = levelFromXp(xp);
  const xpAtLevelStart = level * level * 100;
  const xpAtNextLevel = (level + 1) * (level + 1) * 100;
  const xpForNextLevel = xpAtNextLevel - xpAtLevelStart;
  const xpInLevel = Math.max(0, xp - xpAtLevelStart);
  return { level, xpInLevel, xpForNextLevel };
}
