export function deriveLevelFromXP(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)));
}

export function levelProgress(xp: number): { level: number; nextLevelXP: number; currentLevelXP: number; progressPercent: number } {
  const safeXP = Math.max(0, xp);
  const level = deriveLevelFromXP(safeXP);
  const currentLevelXP = level * level * 100;
  const nextLevel = level + 1;
  const nextLevelXP = nextLevel * nextLevel * 100;
  const denom = nextLevelXP - currentLevelXP;
  const progressPercent = denom > 0 ? Math.min(100, Math.floor(((safeXP - currentLevelXP) / denom) * 100)) : 100;

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progressPercent
  };
}
