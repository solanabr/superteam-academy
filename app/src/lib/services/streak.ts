import type { StreakData } from '@/types';

const STORAGE_KEY_PREFIX = 'superteam-academy-streak-';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export class StreakService {
  static getStreak(wallet: string): StreakData {
    if (typeof window === 'undefined') {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        activityLog: {},
      };
    }

    const key = STORAGE_KEY_PREFIX + wallet;
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        activityLog: {},
      };
    }

    const data: StreakData = JSON.parse(stored);

    // Check if streak is broken (no activity yesterday or today)
    const today = getToday();
    const yesterday = getYesterday();
    if (
      data.lastActivityDate !== today &&
      data.lastActivityDate !== yesterday
    ) {
      data.currentStreak = 0;
    }

    return data;
  }

  static recordActivity(wallet: string): StreakData {
    if (typeof window === 'undefined') {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        activityLog: {},
      };
    }

    const key = STORAGE_KEY_PREFIX + wallet;
    const data = this.getStreak(wallet);
    const today = getToday();
    const yesterday = getYesterday();

    // Already recorded today
    if (data.lastActivityDate === today) return data;

    // Extend streak if yesterday was active
    if (data.lastActivityDate === yesterday) {
      data.currentStreak += 1;
    } else {
      data.currentStreak = 1;
    }

    data.lastActivityDate = today;
    data.activityLog[today] = true;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);

    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  /** Get activity for the last N days (for calendar visualization) */
  static getRecentActivity(
    wallet: string,
    days: number = 30
  ): Record<string, boolean> {
    const data = this.getStreak(wallet);
    const result: Record<string, boolean> = {};
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result[dateStr] = data.activityLog[dateStr] || false;
    }

    return result;
  }
}
