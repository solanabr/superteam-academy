import type { StreakData } from "@/types";

const STREAK_KEY = "academy_streak";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.abs(Math.round((da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getStreakData(_userId?: string): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakHistory: [] };
  }
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakHistory: [] };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakHistory: [] };
  }
}

export function recordActivity(_userId?: string): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakHistory: [] };
  }

  const today = todayStr();
  const streak = getStreakData();

  if (streak.lastActivityDate === today) {
    return streak; // Already recorded today
  }

  const isConsecutive =
    streak.lastActivityDate !== null &&
    daysBetween(streak.lastActivityDate, today) === 1;

  const newCurrent = isConsecutive ? streak.currentStreak + 1 : 1;
  const newHistory = [...(streak.streakHistory ?? [])];
  if (!newHistory.includes(today)) {
    newHistory.push(today);
  }

  const updated: StreakData = {
    currentStreak: newCurrent,
    longestStreak: Math.max(newCurrent, streak.longestStreak),
    lastActivityDate: today,
    streakHistory: newHistory.slice(-365), // Keep last year
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export function resetStreak(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STREAK_KEY);
  }
}
