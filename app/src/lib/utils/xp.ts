import { XPBalance } from "@/types";

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function calculateXPBalance(totalXp: number): XPBalance {
  const level = calculateLevel(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const levelProgress = Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return {
    amount: totalXp,
    level,
    levelProgress,
    xpToNextLevel: nextLevelXp - totalXp,
    xpForCurrentLevel: currentLevelXp,
  };
}

export function getLevelName(level: number): string {
  const names: Record<number, string> = {
    0: "Newcomer",
    1: "Explorer",
    2: "Learner",
    3: "Builder",
    4: "Developer",
    5: "Engineer",
    6: "Architect",
    7: "Expert",
    8: "Master",
    9: "Legend",
    10: "Grandmaster",
  };
  if (level >= 10) return "Grandmaster";
  return names[level] ?? `Level ${level}`;
}

export function getLevelColor(level: number): string {
  if (level >= 10) return "#FFD700";
  if (level >= 8) return "#FF6B00";
  if (level >= 6) return "#9945FF";
  if (level >= 4) return "#14F195";
  if (level >= 2) return "#00C2FF";
  return "#64748b";
}

export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toLocaleString();
}
