/**
 * Daily login streak types.
 */

/** Current daily login streak state */
export interface DailyLoginStreak {
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string | null; // YYYY-MM-DD
    totalLoginXp: number;         // Current active login XP (resets on break)
    streakBroken: boolean;        // True if streak was just broken this session
    todayXp: number;              // XP earned today
    todayCredited: boolean;       // Already credited today?
}
