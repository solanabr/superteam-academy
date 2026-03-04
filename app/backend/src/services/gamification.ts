/**
 * GamificationService
 * Pure functions for XP and level calculations.
 * Level formula: floor(sqrt(totalXP / 100))
 */

/**
 * Calculate level from total XP.
 * Level 0 = 0 XP, Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP...
 */
export const getLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 100));
};

/**
 * XP required to reach a given level.
 * level^2 * 100
 */
export const getXPForLevel = (level: number): number => {
    return level * level * 100;
};

/**
 * XP required to reach the next level from current XP.
 */
export const getXPForNextLevel = (xp: number): number => {
    const currentLevel = getLevel(xp);
    return getXPForLevel(currentLevel + 1);
};

/**
 * Full XP progress summary — used in profile, dashboard, leaderboard.
 */
export interface XPProgress {
    level: number;
    totalXP: number;
    currentLevelXP: number;  // XP at the start of current level
    nextLevelXP: number;     // XP needed for next level
    progressXP: number;      // XP earned within the current level
    rangeXP: number;         // Total XP span of current level
    progressPercent: number; // 0–100
}

export const getXPProgress = (totalXP: number): XPProgress => {
    const level = getLevel(totalXP);
    const currentLevelXP = getXPForLevel(level);
    const nextLevelXP = getXPForLevel(level + 1);
    const progressXP = totalXP - currentLevelXP;
    const rangeXP = nextLevelXP - currentLevelXP;
    const progressPercent = rangeXP > 0 ? Math.round((progressXP / rangeXP) * 100) : 0;

    return {
        level,
        totalXP,
        currentLevelXP,
        nextLevelXP,
        progressXP,
        rangeXP,
        progressPercent,
    };
};
