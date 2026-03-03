/**
 * Streak types — gamification tracking.
 */

/** Main streak state for a user */
export interface Streak {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null; // YYYY-MM-DD or null
    freezeCount: number;
    maxFreezes: number;
}

/** Single day's activity record */
export interface StreakDay {
    date: string; // YYYY-MM-DD
    xpEarned: number;
    lessonsCompleted: number;
    coursesCompleted: number;
}

/** Milestone reward definition */
export interface StreakMilestone {
    days: number;
    xpReward: number;
    achievement?: string;
    claimed: boolean;
    /** On-chain tx signature if claimed on-chain */
    txSignature?: string | null;
}

/** Predefined milestone tiers */
export const STREAK_MILESTONES: Omit<StreakMilestone, 'claimed'>[] = [
    { days: 7, xpReward: 100, achievement: 'week-warrior' },
    { days: 30, xpReward: 500, achievement: 'monthly-master' },
    { days: 100, xpReward: 2000, achievement: 'consistency-king' },
    { days: 365, xpReward: 10000, achievement: 'year-legend' },
];

/** Default freeze count — must match DB migration DEFAULT */
export const DEFAULT_MAX_FREEZES = 3;

/** Default streak state (used when user has no streak row yet) */
export const DEFAULT_STREAK: Streak = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    freezeCount: DEFAULT_MAX_FREEZES,
    maxFreezes: DEFAULT_MAX_FREEZES,
};

/** Full streak data returned by the API */
export interface StreakData {
    streak: Streak;
    activity: StreakDay[];
    milestones: StreakMilestone[];
}

