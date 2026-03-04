import { User } from "../models/users";
import { getLevel } from "./gamification";
import { checkStreakAchievements } from "./achievements";

// ─── XP Constants ─────────────────────────────────────────────────────────────

/** Awarded once per new calendar day when the user has any learning activity. */
const DAILY_STREAK_BONUS_XP = 10;
/** Awarded on the first completion of each new calendar day. */
const FIRST_OF_DAY_BONUS_XP = 25;

/** One-time milestone bonuses (key = streak day threshold, value = XP). */
const STREAK_MILESTONE_XP: Record<number, number> = {
    7: 50,
    30: 200,
    100: 500,
};

// ─── Return Type ──────────────────────────────────────────────────────────────

export interface StreakUpdateResult {
    currentStreak: number;
    longestStreak: number;
    xpAwarded: number;       // Total XP granted this call (0 if already active today)
    isNewDay: boolean;       // True if this is the first activity of the calendar day
    milestoneReached: number | null; // e.g. 7, 30, or 100 if hit this call
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * updateStreak
 * Called after any learning activity (lesson complete, test attempt).
 *
 * XP awarded (only on the first activity of a new calendar day):
 *   +10 Daily streak bonus
 *   +25 First completion of the day
 *   +milestone bonus if streak crosses 7 / 30 / 100 (one-time each)
 */
export const updateStreak = async (userId: string): Promise<StreakUpdateResult> => {
    const user = await User.findById(userId);
    if (!user) {
        return { currentStreak: 0, longestStreak: 0, xpAwarded: 0, isNewDay: false, milestoneReached: null };
    }

    const today = new Date();
    const todayStr = toDateString(today);

    // ── Activity dates heatmap ────────────────────────────────────────────────
    if (!user.activityDates) user.activityDates = [];
    const isNewDay = !user.activityDates.includes(todayStr);

    if (isNewDay) {
        user.activityDates.push(todayStr);
        // Keep only last 365 days
        if (user.activityDates.length > 365) {
            user.activityDates = user.activityDates.slice(-365);
        }
    }

    // ── Streak calculation ────────────────────────────────────────────────────
    const lastActive = user.lastActive;

    if (!lastActive) {
        user.currentStreak = 1;
    } else {
        const lastStr = toDateString(lastActive);
        const diffDays = daysBetween(lastActive, today);

        if (lastStr === todayStr) {
            // Already active today — only update heatmap, don't touch streak
        } else if (diffDays === 1) {
            user.currentStreak = (user.currentStreak || 0) + 1;
        } else {
            // Gap of 2+ days — reset streak
            user.currentStreak = 1;
        }
    }

    // Update longest streak
    if (user.currentStreak > (user.longestStreak || 0)) {
        user.longestStreak = user.currentStreak;
    }

    user.lastActive = today;

    // ── XP Bonuses ────────────────────────────────────────────────────────────
    let xpAwarded = 0;
    let milestoneReached: number | null = null;

    if (isNewDay) {
        // Daily streak bonus + first-of-day bonus
        xpAwarded += DAILY_STREAK_BONUS_XP + FIRST_OF_DAY_BONUS_XP;

        // Streak milestone rewards (one-time per threshold)
        if (!user.claimedStreakMilestones) user.claimedStreakMilestones = [];

        for (const [threshold, bonus] of Object.entries(STREAK_MILESTONE_XP)) {
            const day = Number(threshold);
            if (
                user.currentStreak >= day &&
                !user.claimedStreakMilestones.includes(day)
            ) {
                xpAwarded += bonus;
                user.claimedStreakMilestones.push(day);
                milestoneReached = day;
            }
        }
    }

    if (xpAwarded > 0) {
        user.totalXP = (user.totalXP || 0) + xpAwarded;
        user.level = getLevel(user.totalXP);
    }

    await user.save();

    // ── Achievement checks (fire-and-forget) ──────────────────────────────────
    checkStreakAchievements(userId, user.currentStreak).catch((err) =>
        console.error("[updateStreak] achievement check failed:", err)
    );

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        xpAwarded,
        isNewDay,
        milestoneReached,
    };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as "YYYY-MM-DD" in UTC. */
const toDateString = (date: Date): string => {
    return date.toISOString().split("T")[0];
};

/**
 * Return the number of whole calendar days between two dates.
 * Positive if b is after a.
 */
const daysBetween = (a: Date, b: Date): number => {
    const msPerDay = 86400000;
    const aDay = Math.floor(a.getTime() / msPerDay);
    const bDay = Math.floor(b.getTime() / msPerDay);
    return Math.abs(bDay - aDay);
};
