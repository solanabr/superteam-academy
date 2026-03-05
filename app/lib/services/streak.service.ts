/**
 * Streak tracking service using localStorage.
 * Tracks daily learning activity and calculates current/longest streaks.
 */

const STREAK_KEY_PREFIX = "superteam_streak_";
const ACTIVITY_KEY_PREFIX = "superteam_activity_";

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string; // YYYY-MM-DD
    activeDays: string[]; // Array of YYYY-MM-DD
}

function getDateKey(date: Date = new Date()): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getStorageKey(wallet: string): string {
    return `${STREAK_KEY_PREFIX}${wallet}`;
}

function getActivityKey(wallet: string): string {
    return `${ACTIVITY_KEY_PREFIX}${wallet}`;
}

function loadStreakData(wallet: string): StreakData {
    if (typeof window === "undefined") {
        return { currentStreak: 0, longestStreak: 0, lastActivityDate: "", activeDays: [] };
    }
    const raw = localStorage.getItem(getStorageKey(wallet));
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            // Corrupted data, reset
        }
    }
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: "", activeDays: [] };
}

function saveStreakData(wallet: string, data: StreakData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(wallet), JSON.stringify(data));
}

/** Calculate difference in calendar days between two date strings (YYYY-MM-DD) */
function daysDifference(dateA: string, dateB: string): number {
    const a = new Date(dateA + "T00:00:00");
    const b = new Date(dateB + "T00:00:00");
    return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export interface ActivityItem {
    type: "lesson_completed" | "challenge_solved" | "course_completed" | "achievement_earned" | "streak_milestone";
    title: string;
    description: string;
    xpEarned: number;
    timestamp: string; // ISO
}

function loadActivity(wallet: string): ActivityItem[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(getActivityKey(wallet));
    if (raw) {
        try { return JSON.parse(raw); } catch { /* */ }
    }
    return [];
}

function saveActivity(wallet: string, items: ActivityItem[]): void {
    if (typeof window === "undefined") return;
    // Keep last 50 items
    localStorage.setItem(getActivityKey(wallet), JSON.stringify(items.slice(0, 50)));
}

export const streakService = {
    /**
     * Record a learning activity for today. Updates streak counters.
     */
    recordActivity(wallet: string, activity: Omit<ActivityItem, "timestamp">): void {
        const today = getDateKey();
        const data = loadStreakData(wallet);

        // Add to activity log
        const items = loadActivity(wallet);
        items.unshift({ ...activity, timestamp: new Date().toISOString() });
        saveActivity(wallet, items);

        // Already recorded today — no streak change
        if (data.lastActivityDate === today) {
            return;
        }

        // Update active days
        if (!data.activeDays.includes(today)) {
            data.activeDays.push(today);
            // Keep last 365 days
            if (data.activeDays.length > 365) {
                data.activeDays = data.activeDays.slice(-365);
            }
        }

        if (data.lastActivityDate === "") {
            // First ever activity
            data.currentStreak = 1;
        } else {
            const diff = daysDifference(today, data.lastActivityDate);
            if (diff === 1) {
                // Consecutive day — extend streak
                data.currentStreak += 1;
            } else if (diff > 1) {
                // Streak broken — restart
                data.currentStreak = 1;
            }
            // diff === 0 shouldn't happen (guarded above), diff < 0 = clock issue
        }

        data.lastActivityDate = today;
        data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
        saveStreakData(wallet, data);
    },

    /**
     * Get the current streak count. Checks if streak is still active (activity today or yesterday).
     */
    getCurrentStreak(wallet: string): number {
        const data = loadStreakData(wallet);
        if (!data.lastActivityDate) return 0;

        const today = getDateKey();
        const diff = daysDifference(today, data.lastActivityDate);

        if (diff > 1) {
            // Streak broken — hasn't been active since yesterday
            return 0;
        }
        return data.currentStreak;
    },

    /**
     * Get the longest streak ever recorded.
     */
    getLongestStreak(wallet: string): number {
        return loadStreakData(wallet).longestStreak;
    },

    /**
     * Get all active days for calendar/heatmap display.
     */
    getActiveDays(wallet: string): Date[] {
        return loadStreakData(wallet).activeDays.map(d => new Date(d + "T00:00:00"));
    },

    /**
     * Get recent activity items.
     */
    getRecentActivity(wallet: string, limit: number = 10): ActivityItem[] {
        return loadActivity(wallet).slice(0, limit);
    },
};
