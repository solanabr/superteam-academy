/**
 * XP calculation utilities for Superteam Academy.
 *
 * Pure functions for level progression, completion bonuses,
 * and creator rewards. No Solana dependencies — safe for
 * use in both server and client contexts.
 */

// ─── Level Thresholds ────────────────────────────────────────────────

/** XP thresholds for each level (index = level - 1) */
const LEVEL_THRESHOLDS = [
    0,       // Level 1: 0+
    1_000,   // Level 2: 1,000+
    2_500,   // Level 3: 2,500+
    5_000,   // Level 4: 5,000+
    10_000,  // Level 5: 10,000+
    20_000,  // Level 6: 20,000+
    35_000,  // Level 7: 35,000+
    55_000,  // Level 8: 55,000+
    80_000,  // Level 9: 80,000+
    120_000, // Level 10: 120,000+
] as const;

/** Maximum level */
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

// ─── Level Functions ─────────────────────────────────────────────────

/**
 * Calculate the level for a given XP amount.
 * Returns a value between 1 and MAX_LEVEL.
 */
export function calculateLevel(xp: number): number {
    const safeXp = Math.max(0, xp);
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (safeXp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

/**
 * Get the XP required to reach a specific level.
 */
export function getXpForLevel(level: number): number {
    const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
    return LEVEL_THRESHOLDS[clamped - 1];
}

/**
 * Get the XP threshold for the next level.
 * Returns Infinity if already at max level.
 */
export function getNextLevelXp(xp: number): number {
    const currentLevel = calculateLevel(xp);
    if (currentLevel >= MAX_LEVEL) return Infinity;
    return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Calculate progress percentage within the current level (0-100).
 */
export function getLevelProgress(xp: number): number {
    const level = calculateLevel(xp);
    if (level >= MAX_LEVEL) return 100;

    const currentThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[level];
    const range = nextThreshold - currentThreshold;

    if (range === 0) return 100;
    return Math.floor(((xp - currentThreshold) / range) * 100);
}

// ─── XP Calculation Functions ────────────────────────────────────────

/**
 * Calculate the completion bonus for finishing all lessons.
 * Formula: floor((xpPerLesson * lessonCount) / 2)
 */
export function calculateCompletionBonus(
    xpPerLesson: number,
    lessonCount: number
): number {
    const safeXp = Math.max(0, Math.floor(xpPerLesson));
    const safeLessons = Math.max(0, Math.floor(lessonCount));
    return Math.floor((safeXp * safeLessons) / 2);
}

/**
 * Calculate total XP earnable from a course (lessons + bonus).
 */
export function calculateCourseTotalXp(
    xpPerLesson: number,
    lessonCount: number
): number {
    const safeXp = Math.max(0, Math.floor(xpPerLesson));
    const safeLessons = Math.max(0, Math.floor(lessonCount));
    const lessonXp = safeXp * safeLessons;
    const bonus = calculateCompletionBonus(safeXp, safeLessons);
    return lessonXp + bonus;
}

/**
 * Calculate creator reward XP based on completion count.
 * Returns the reward amount if the completion threshold is met, else 0.
 */
export function calculateCreatorReward(
    creatorRewardXp: number,
    minCompletionsForReward: number,
    currentCompletions: number
): number {
    const safeReward = Math.max(0, Math.floor(creatorRewardXp));
    const safeMin = Math.max(0, Math.floor(minCompletionsForReward));
    const safeCurrent = Math.max(0, Math.floor(currentCompletions));
    if (safeCurrent >= safeMin) {
        return safeReward;
    }
    return 0;
}
