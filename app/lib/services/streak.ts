/**
 * Streak tracking — frontend-only (localStorage). Not on-chain.
 * See docs/INTEGRATION.md.
 */

import type { StreakData } from './types';

const KEY_PREFIX = 'lms_streak_';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseHistory(history: { date: string; completed: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  history.forEach((h) => m.set(h.date, h.completed));
  return m;
}

function computeStreaks(history: { date: string; completed: number }[]): { current: number; longest: number } {
  const daysWithActivity = Array.from(new Set(history.filter((h) => h.completed > 0).map((h) => h.date))).sort().reverse();
  if (daysWithActivity.length === 0) return { current: 0, longest: 0 };
  const today = todayISO();
  let current = 0;
  let run = 0;
  let expectDate = today;
  for (const d of daysWithActivity) {
    if (d !== expectDate) break;
    run++;
    if (run === 1) current = run;
    else current = run;
    expectDate = new Date(new Date(expectDate).getTime() - 86400000).toISOString().slice(0, 10);
  }
  let longest = 0;
  run = 0;
  let prev = '';
  for (const d of daysWithActivity) {
    if (prev && new Date(prev).getTime() - new Date(d).getTime() !== 86400000) run = 0;
    run++;
    prev = d;
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

export function getStreakData(wallet: string): StreakData {
  if (typeof window === 'undefined') {
    return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
  }
  const key = KEY_PREFIX + wallet;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
    const data = JSON.parse(raw) as StreakData;
    const { current, longest } = computeStreaks(data.history);
    return {
      ...data,
      currentStreak: current,
      longestStreak: longest,
      lastActivityDate: data.history.length ? data.history[data.history.length - 1].date : null,
    };
  } catch {
    return { wallet, currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] };
  }
}

export function recordActivity(wallet: string, completedCount: number): void {
  if (typeof window === 'undefined') return;
  const key = KEY_PREFIX + wallet;
  const data = getStreakData(wallet);
  const today = todayISO();
  const map = parseHistory(data.history);
  const existing = map.get(today) ?? 0;
  map.set(today, existing + completedCount);
  const history = Array.from(map.entries()).map(([date, completed]) => ({ date, completed })).sort((a, b) => a.date.localeCompare(b.date));
  const updated: StreakData = {
    wallet,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: today,
    history,
  };
  const { current, longest } = computeStreaks(history);
  updated.currentStreak = current;
  updated.longestStreak = longest;
  localStorage.setItem(key, JSON.stringify(updated));
}
