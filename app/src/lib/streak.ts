import { StreakData } from '@/types';

const STREAK_KEY = 'superteam_academy_streak';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
  }
  const raw = localStorage.getItem(STREAK_KEY);
  if (!raw) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
  return JSON.parse(raw);
}

export function recordActivity(): StreakData {
  const streak = getStreak();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  if (streak.lastActivityDate === today) return streak;

  if (streak.lastActivityDate === yesterday) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActivityDate = today;

  if (!streak.history.includes(today)) {
    streak.history.push(today);
    if (streak.history.length > 365) streak.history = streak.history.slice(-365);
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  return streak;
}

export function isStreakActive(): boolean {
  const streak = getStreak();
  const today = getTodayStr();
  return streak.lastActivityDate === today;
}
