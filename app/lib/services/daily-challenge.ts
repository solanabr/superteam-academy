export type DailyChallengeLanguage = "typescript" | "rust" | "json";

export interface DailyChallengeTestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  language: DailyChallengeLanguage;
  xpReward: number;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  testCases: DailyChallengeTestCase[];
  timeLimitMinutes: number;
}

export interface DailyChallengeResponse {
  challenge: DailyChallenge;
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DAILY_CHALLENGE_COURSE_ID =
  process.env.NEXT_PUBLIC_DAILY_CHALLENGE_COURSE_ID?.trim() ?? "";

export const DAILY_CHALLENGE_XP = parsePositiveInt(
  process.env.NEXT_PUBLIC_DAILY_CHALLENGE_XP,
  50
);

export const DAILY_CHALLENGE_TIMER_MINUTES = parsePositiveInt(
  process.env.NEXT_PUBLIC_DAILY_CHALLENGE_TIMER_MINUTES,
  45
);

export const DAILY_CHALLENGE_SLOT_COUNT = parsePositiveInt(
  process.env.NEXT_PUBLIC_DAILY_CHALLENGE_SLOT_COUNT,
  366
);

export const DAILY_CHALLENGE_EPOCH_DATE =
  process.env.NEXT_PUBLIC_DAILY_CHALLENGE_EPOCH_DATE?.trim() ?? "2026-01-01";

export function getUtcDateKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTimeUntilNextUtcDayMs(now = new Date()): number {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  ));
  return Math.max(0, next.getTime() - now.getTime());
}

export function getDailyChallengeLessonIndex(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const epoch = new Date(`${DAILY_CHALLENGE_EPOCH_DATE}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || Number.isNaN(epoch.getTime())) {
    return 0;
  }

  const deltaDays = Math.floor((date.getTime() - epoch.getTime()) / MS_IN_DAY);
  const normalized = ((deltaDays % DAILY_CHALLENGE_SLOT_COUNT) + DAILY_CHALLENGE_SLOT_COUNT) % DAILY_CHALLENGE_SLOT_COUNT;
  return normalized;
}

export function clampDailyChallengeXp(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DAILY_CHALLENGE_XP;
  }
  return Math.trunc(value);
}

export function clampDailyChallengeTimerMinutes(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DAILY_CHALLENGE_TIMER_MINUTES;
  }
  return Math.trunc(value);
}
