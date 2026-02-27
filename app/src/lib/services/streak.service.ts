import { connectToDatabase } from '@/lib/mongodb';
import { UserStreak, IUserStreak, IStreakHistoryEntry } from '@/models/UserStreak';
import mongoose from 'mongoose';

/**
 * Streak Service
 * Handles streak persistence, calculation, and rewards
 */

export interface StreakActivityInput {
  userId: string;
  xpEarned?: number;
  lessonsCompleted?: number;
  challengesSolved?: number;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  streakContinued: boolean;
  newMilestone: StreakMilestoneReward | null;
  xpBonuses: Array<{ type: string; amount: number }>;
}

export interface StreakMilestoneReward {
  days: number;
  name: string;
  xpReward: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  freezeAvailable: boolean;
  freezeUsedDate: Date | null;
  totalActiveDays: number;
  averageXpPerDay: number;
}

// Streak milestone definitions
const STREAK_MILESTONES: StreakMilestoneReward[] = [
  { days: 3, name: 'Getting Started', xpReward: 25 },
  { days: 7, name: 'Week Warrior', xpReward: 100 },
  { days: 14, name: 'Two Week Champion', xpReward: 200 },
  { days: 30, name: 'Monthly Master', xpReward: 500 },
  { days: 60, name: 'Two Month Titan', xpReward: 1000 },
  { days: 100, name: 'Consistency King', xpReward: 2000 },
  { days: 365, name: 'Yearly Legend', xpReward: 10000 },
];

// Daily streak bonus XP
const DAILY_STREAK_BONUS = 10;
const FIRST_ACTIVITY_BONUS = 25;

export class StreakService {
  /**
   * Get user's streak data
   */
  static async getStreak(userId: string): Promise<StreakStats> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const streak = await UserStreak.findOne({ user_id: userObjectId });

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeAvailable: true,
        freezeUsedDate: null,
        totalActiveDays: 0,
        averageXpPerDay: 0,
      };
    }

    // Calculate total active days and average XP
    const totalActiveDays = streak.streak_history.length;
    const totalXp = streak.streak_history.reduce((sum, entry) => sum + entry.xp, 0);
    const averageXpPerDay = totalActiveDays > 0 ? Math.round(totalXp / totalActiveDays) : 0;

    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      lastActivityDate: streak.last_activity_date,
      freezeAvailable: streak.freeze_available,
      freezeUsedDate: streak.freeze_used_date || null,
      totalActiveDays,
      averageXpPerDay,
    };
  }

  /**
   * Record activity and update streak
   */
  static async recordActivity(input: StreakActivityInput): Promise<StreakUpdateResult> {
    await connectToDatabase();

    const { userId, xpEarned = 0, lessonsCompleted = 0, challengesSolved = 0 } = input;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = await UserStreak.findOne({ user_id: userObjectId });
    const xpBonuses: Array<{ type: string; amount: number }> = [];
    let streakBroken = false;
    let streakContinued = false;
    let newMilestone: StreakMilestoneReward | null = null;

    if (!streak) {
      // New user - create streak record
      streak = await UserStreak.create({
        user_id: userObjectId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        streak_history: [
          {
            date: today,
            xp: xpEarned,
            lessons_completed: lessonsCompleted,
            challenges_solved: challengesSolved,
          },
        ],
        freeze_available: true,
      });

      // First activity bonus
      xpBonuses.push({ type: 'first_activity', amount: FIRST_ACTIVITY_BONUS });

      return {
        currentStreak: 1,
        longestStreak: 1,
        streakBroken: false,
        streakContinued: false,
        newMilestone: null,
        xpBonuses,
      };
    }

    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
    }

    // Check if already recorded today
    if (lastActivity && lastActivity.getTime() === today.getTime()) {
      // Update today's history entry
      const todayIndex = streak.streak_history.findIndex(
        (h) => new Date(h.date).setHours(0, 0, 0, 0) === today.getTime()
      );

      if (todayIndex !== -1) {
        streak.streak_history[todayIndex].xp += xpEarned;
        streak.streak_history[todayIndex].lessons_completed += lessonsCompleted;
        streak.streak_history[todayIndex].challenges_solved += challengesSolved;
      }

      await streak.save();

      return {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        streakBroken: false,
        streakContinued: false,
        newMilestone: null,
        xpBonuses: [], // No bonus for same-day activity
      };
    }

    // Determine streak status
    const previousStreak = streak.current_streak;

    if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
      // Continuing streak
      streak.current_streak += 1;
      streak.longest_streak = Math.max(streak.longest_streak, streak.current_streak);
      streakContinued = true;

      // Daily streak bonus
      xpBonuses.push({ type: 'streak_bonus', amount: DAILY_STREAK_BONUS });

      // Check for milestone
      newMilestone = STREAK_MILESTONES.find((m) => m.days === streak.current_streak) || null;
      if (newMilestone) {
        xpBonuses.push({
          type: `milestone_${newMilestone.days}`,
          amount: newMilestone.xpReward,
        });
      }
    } else if (lastActivity) {
      // Streak potentially broken
      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity === 2 && streak.freeze_available) {
        // Use streak freeze (missed exactly 1 day)
        streak.freeze_available = false;
        streak.freeze_used_date = yesterday;
        streak.current_streak += 1;
        streak.longest_streak = Math.max(streak.longest_streak, streak.current_streak);
        streakContinued = true;

        xpBonuses.push({ type: 'streak_bonus', amount: DAILY_STREAK_BONUS });
      } else {
        // Streak broken
        streakBroken = true;
        streak.current_streak = 1;
        // Reset freeze for new streak
        streak.freeze_available = true;
        streak.freeze_used_date = undefined;
      }
    } else {
      // First activity or no previous record
      streak.current_streak = 1;
      xpBonuses.push({ type: 'first_activity', amount: FIRST_ACTIVITY_BONUS });
    }

    // Update last activity date
    streak.last_activity_date = today;

    // Add to history
    streak.streak_history.push({
      date: today,
      xp: xpEarned,
      lessons_completed: lessonsCompleted,
      challenges_solved: challengesSolved,
    } as IStreakHistoryEntry);

    // Keep only last 365 days of history
    if (streak.streak_history.length > 365) {
      streak.streak_history = streak.streak_history.slice(-365);
    }

    await streak.save();

    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      streakBroken,
      streakContinued,
      newMilestone,
      xpBonuses,
    };
  }

  /**
   * Get streak calendar data (last N days)
   */
  static async getStreakCalendar(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; hasActivity: boolean; xp: number }>> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const streak = await UserStreak.findOne({ user_id: userObjectId });

    const calendar: Array<{ date: string; hasActivity: boolean; xp: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of activity dates
    const activityMap = new Map<string, number>();
    if (streak) {
      streak.streak_history.forEach((entry) => {
        const dateStr = new Date(entry.date).toISOString().split('T')[0];
        activityMap.set(dateStr, entry.xp);
      });
    }

    // Build calendar for last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const xp = activityMap.get(dateStr) || 0;

      calendar.push({
        date: dateStr,
        hasActivity: xp > 0,
        xp,
      });
    }

    return calendar;
  }

  /**
   * Check if user's streak is at risk (no activity today)
   */
  static async isStreakAtRisk(userId: string): Promise<boolean> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const streak = await UserStreak.findOne({ user_id: userObjectId });

    if (!streak || streak.current_streak === 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;

    if (!lastActivity) {
      return false;
    }

    lastActivity.setHours(0, 0, 0, 0);

    // At risk if last activity was yesterday and no activity today yet
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return lastActivity.getTime() === yesterday.getTime();
  }

  /**
   * Get leaderboard by streak
   */
  static async getStreakLeaderboard(limit: number = 50): Promise<
    Array<{
      userId: string;
      currentStreak: number;
      longestStreak: number;
      rank: number;
    }>
  > {
    await connectToDatabase();

    const streaks = await UserStreak.find()
      .sort({ current_streak: -1, longest_streak: -1 })
      .limit(limit)
      .lean();

    return streaks.map((streak, index) => ({
      userId: streak.user_id.toString(),
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      rank: index + 1,
    }));
  }

  /**
   * Reset streak freeze (e.g., after monthly renewal)
   */
  static async resetStreakFreeze(userId: string): Promise<void> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    await UserStreak.findOneAndUpdate(
      { user_id: userObjectId },
      {
        freeze_available: true,
        freeze_used_date: null,
      }
    );
  }

  /**
   * Get streak milestones with user progress
   */
  static async getMilestones(userId: string): Promise<
    Array<{
      days: number;
      name: string;
      xpReward: number;
      achieved: boolean;
      progress: number;
    }>
  > {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const streak = await UserStreak.findOne({ user_id: userObjectId });
    const currentStreak = streak?.longest_streak || 0;

    return STREAK_MILESTONES.map((milestone) => ({
      ...milestone,
      achieved: currentStreak >= milestone.days,
      progress: Math.min(Math.round((currentStreak / milestone.days) * 100), 100),
    }));
  }
}
