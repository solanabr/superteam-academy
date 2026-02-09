import type { Difficulty } from "@superteam-lms/types";

export const XP_REWARDS = {
  lesson: { min: 10, max: 50 },
  challenge: { min: 25, max: 100 },
  course: { min: 500, max: 2000 },
  dailyStreak: 10,
  firstDaily: 25,
} as const;

/** @deprecated Use `Difficulty` from `@superteam-lms/types` instead. */
export type LessonDifficulty = Difficulty;

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 0.5,
  advanced: 1,
};

export function calculateLessonXp(difficulty: Difficulty): number {
  const { min, max } = XP_REWARDS.lesson;
  return Math.round(min + (max - min) * DIFFICULTY_MULTIPLIER[difficulty]);
}

export function calculateChallengeXp(difficulty: Difficulty): number {
  const { min, max } = XP_REWARDS.challenge;
  return Math.round(min + (max - min) * DIFFICULTY_MULTIPLIER[difficulty]);
}

export function calculateCourseXp(difficulty: Difficulty): number {
  const { min, max } = XP_REWARDS.course;
  return Math.round(min + (max - min) * DIFFICULTY_MULTIPLIER[difficulty]);
}

export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpToNextLevel(totalXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpRequiredForNext: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpRequiredForNext = nextLevelXp - currentLevelXp;
  const progressPercent =
    xpRequiredForNext > 0 ? (xpInCurrentLevel / xpRequiredForNext) * 100 : 0;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpRequiredForNext,
    progressPercent,
  };
}

export function detectLevelUp(
  xpBefore: number,
  xpAfter: number
): { leveled: boolean; oldLevel: number; newLevel: number } {
  const oldLevel = calculateLevel(xpBefore);
  const newLevel = calculateLevel(xpAfter);
  return {
    leveled: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
}
