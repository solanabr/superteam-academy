import type { StreakData } from "@superteam-lms/types";
import { getNow } from "@/lib/utils";

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
  return streak.lastActivityDate === toDateString(getNow());
}

export function updateStreak(streak: StreakData): StreakData {
  const today = toDateString(getNow());

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
    // Display-only helper: freeze state is server-authoritative, so it is passed
    // through unchanged (this path never mints or consumes a freeze).
    frozenDays: streak.frozenDays,
    freezesRemaining: streak.freezesRemaining,
  };
}

export function shouldResetStreak(streak: StreakData): boolean {
  if (!streak.lastActivityDate) return false;
  const today = toDateString(getNow());
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

/** A calendar cell. `frozen` is a day a streak freeze saved (LX-B8) — an
 *  inactive day that nonetheless kept the streak alive, rendered as a snowflake.
 *  `active` and `frozen` are mutually exclusive: a day with real activity is
 *  never "frozen" even if it also appears in the freeze log. */
export interface StreakCalendarDay {
  date: string;
  active: boolean;
  frozen: boolean;
}

/** Days a freeze saved, merged into the calendar so a forgiven gap renders as a
 *  preserved streak rather than a hole. A day is `frozen` only when it has no
 *  real activity (activity always wins). */
export function generateStreakCalendar(
  streakHistory: Record<string, number>,
  days: number = 30,
  frozenDays: readonly string[] = []
): StreakCalendarDay[] {
  const frozen = new Set(frozenDays);
  const calendar: StreakCalendarDay[] = [];
  const today = getNow();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = toDateString(date);
    const active = (streakHistory[dateStr] ?? 0) > 0;
    calendar.push({
      date: dateStr,
      active,
      frozen: !active && frozen.has(dateStr),
    });
  }

  return calendar;
}

export function generateWeekCalendar(
  streakHistory: Record<string, number>,
  frozenDays: readonly string[] = []
): StreakCalendarDay[] {
  const frozen = new Set(frozenDays);
  const today = getNow();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const calendar: StreakCalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    const dateStr = toDateString(date);
    const active = (streakHistory[dateStr] ?? 0) > 0;
    calendar.push({
      date: dateStr,
      active,
      frozen: !active && frozen.has(dateStr),
    });
  }

  return calendar;
}
