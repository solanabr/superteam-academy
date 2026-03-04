"use client";

const STREAK_ACTIVITY_KEY = "academy_streak_activity_v1";
const LEGACY_HEATMAP_KEY = "academy_heatmap";
const MAX_STORED_DAYS = 400;

export const STREAK_UPDATED_EVENT = "academy:streak-updated";

function formatDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKeyDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return formatDateKeyLocal(date);
}

function normalizeDateKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item)) continue;
    unique.add(item);
  }

  return Array.from(unique).sort((a, b) => b.localeCompare(a)).slice(0, MAX_STORED_DAYS);
}

function readLegacyHeatmap(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_HEATMAP_KEY);
    if (!raw) return [];
    const flags = JSON.parse(raw);
    if (!Array.isArray(flags)) return [];

    const migrated: string[] = [];
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i] === true) {
        migrated.push(toDateKeyDaysAgo(i));
      }
    }
    return normalizeDateKeys(migrated);
  } catch {
    return [];
  }
}

function writeDateKeys(dateKeys: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STREAK_ACTIVITY_KEY, JSON.stringify(dateKeys));
  } catch {
    // Ignore storage write failures (private mode/quota).
  }
}

function emitStreakUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
}

function readDateKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STREAK_ACTIVITY_KEY);
    if (raw) {
      return normalizeDateKeys(JSON.parse(raw));
    }
  } catch {
    // Fall through to migration.
  }

  const migrated = readLegacyHeatmap();
  if (migrated.length > 0) {
    writeDateKeys(migrated);
  }
  return migrated;
}

export function markLearningActivity(date = new Date()): void {
  if (typeof window === "undefined") return;
  const today = formatDateKeyLocal(date);
  const keys = readDateKeys();
  if (keys.includes(today)) return;
  const next = normalizeDateKeys([today, ...keys]);
  writeDateKeys(next);
  emitStreakUpdated();
}

export function markLearningActivityToday(): void {
  markLearningActivity(new Date());
}

export function getStreakHeatmap(days: number): boolean[] {
  if (days <= 0) return [];
  const activeDays = new Set(readDateKeys());
  const flags: boolean[] = [];
  for (let i = 0; i < days; i += 1) {
    flags.push(activeDays.has(toDateKeyDaysAgo(i)));
  }
  return flags;
}

export function getCurrentStreak(maxDays = 365): number {
  const flags = getStreakHeatmap(maxDays);
  let streak = 0;
  for (const active of flags) {
    if (!active) break;
    streak += 1;
  }
  return streak;
}

export function getTotalActiveDays(days = 70): number {
  return getStreakHeatmap(days).filter(Boolean).length;
}

