import type { StreakData } from "@superteam-lms/types";

export const STREAK_MILESTONES = [
  { days: 7, id: "week-warrior", name: "Week Warrior" },
  { days: 30, id: "monthly-master", name: "Monthly Master" },
  { days: 100, id: "consistency-king", name: "Consistency King" },
] as const;

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0] as string;
}

function daysBetween(a: string, b: string): number {
  const dateA = new Date(a);
  const dateB = new Date(b);
  const diffMs = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isActiveToday(streak: StreakData): boolean {
  return streak.lastActivityDate === toDateString(new Date());
}

export function updateStreak(streak: StreakData): StreakData {
  const today = toDateString(new Date());

  if (streak.lastActivityDate === today) {
    return streak;
  }

  const gap = streak.lastActivityDate
    ? daysBetween(streak.lastActivityDate, today)
    : 0;

  const isConsecutive = gap === 1;
  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  const newLongest = Math.max(streak.longestStreak, newStreak);

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: today,
    streakHistory: {
      ...streak.streakHistory,
      [today]: (streak.streakHistory[today] ?? 0) + 1,
    },
  };
}

export function shouldResetStreak(streak: StreakData): boolean {
  if (!streak.lastActivityDate) return false;
  const today = toDateString(new Date());
  const gap = daysBetween(streak.lastActivityDate, today);
  return gap > 1;
}

export function getStreakMilestones(
  currentStreak: number
): (typeof STREAK_MILESTONES)[number][] {
  return STREAK_MILESTONES.filter((m) => currentStreak >= m.days);
}

export function getNextMilestone(
  currentStreak: number
): (typeof STREAK_MILESTONES)[number] | null {
  return STREAK_MILESTONES.find((m) => currentStreak < m.days) ?? null;
}

export function generateStreakCalendar(
  streakHistory: Record<string, number>,
  days: number = 30
): { date: string; active: boolean }[] {
  const calendar: { date: string; active: boolean }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = toDateString(date);
    calendar.push({
      date: dateStr,
      active: (streakHistory[dateStr] ?? 0) > 0,
    });
  }

  return calendar;
}

export function generateWeekCalendar(
  streakHistory: Record<string, number>
): { date: string; active: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const calendar: { date: string; active: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    const dateStr = toDateString(date);
    calendar.push({
      date: dateStr,
      active: (streakHistory[dateStr] ?? 0) > 0,
    });
  }

  return calendar;
}
