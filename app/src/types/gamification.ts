export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;
  isActiveToday: boolean;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: "progress" | "streak" | "skill" | "special";
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source:
    | "lesson"
    | "challenge"
    | "course"
    | "streak"
    | "achievement"
    | "daily_first"
    | "onchain_sync";
  sourceId?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  totalXP: number;
  level: number;
  currentStreak: number;
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
}

export function calculateLevel(totalXP: number): LevelInfo {
  const level = Math.floor(Math.sqrt(totalXP / 100));
  const xpForCurrentLevel = level * level * 100;
  const xpForNextLevel = (level + 1) * (level + 1) * 100;
  const progress = totalXP - xpForCurrentLevel;
  const needed = xpForNextLevel - xpForCurrentLevel;
  return {
    level,
    currentXP: totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    progress: needed > 0 ? progress / needed : 1,
  };
}
