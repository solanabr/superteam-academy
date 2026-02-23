export const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100));

export const getXpForLevel = (level: number) => level * level * 100;

export const getXpForNextLevel = (xp: number) => getXpForLevel(getLevel(xp) + 1);

export const getLevelProgress = (xp: number) => {
  const level = getLevel(xp);
  if (level === 0 && xp === 0) return 0;
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForNextLevel(xp);
  const range = nextLevelXp - currentLevelXp;
  if (range === 0) return 1;
  return (xp - currentLevelXp) / range;
};
