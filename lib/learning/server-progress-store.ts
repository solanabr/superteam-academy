import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import {
  LeaderboardEntry,
  Progress,
  StreakData,
  Timeframe
} from '@/lib/types';
import { levelFromXP } from '@/lib/utils';

const DEFAULT_LOCAL_STORE_PATH = join(process.cwd(), '.learning', 'store.json');
const DEFAULT_VERCEL_STORE_PATH = '/tmp/superteam-learning-store.json';

function resolveStorePath(): string {
  const configured = process.env.LEARNING_STORE_PATH?.trim();
  if (configured && configured.length > 0) {
    return isAbsolute(configured) ? configured : join(process.cwd(), configured);
  }

  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
    return DEFAULT_VERCEL_STORE_PATH;
  }

  return DEFAULT_LOCAL_STORE_PATH;
}

const STORE_PATH = resolveStorePath();

interface LearningTxRecord {
  id: string;
  userId: string;
  action: 'enroll_course' | 'complete_lesson';
  courseId: string;
  lessonIndex?: number;
  signature: string;
  createdAt: string;
}

interface LearningUserState {
  enrollments: string[];
  progressByCourse: Record<string, number[]>;
  xpByCourse: Record<string, number>;
  totalXP: number;
  streak: StreakData;
  achievementsBitmap: string;
}

interface LearningStoreData {
  users: Record<string, LearningUserState>;
  txHistory: LearningTxRecord[];
}

interface LessonCompletionResult {
  alreadyCompleted: boolean;
  xpAwarded: number;
  totalXP: number;
  streak: StreakData;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return nowIso().split('T')[0] ?? '';
}

function toDateMillis(isoDate: string): number | null {
  const value = new Date(`${isoDate}T00:00:00.000Z`).getTime();
  return Number.isNaN(value) ? null : value;
}

function isConsecutiveDate(previousDate: string, currentDate: string): boolean {
  const previousMillis = toDateMillis(previousDate);
  const currentMillis = toDateMillis(currentDate);

  if (previousMillis === null || currentMillis === null) {
    return false;
  }

  const diffDays = (currentMillis - previousMillis) / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

function defaultStreak(): StreakData {
  return {
    current: 0,
    longest: 0,
    lastActiveDate: '',
    activeDates: []
  };
}

function defaultUserState(): LearningUserState {
  return {
    enrollments: [],
    progressByCourse: {},
    xpByCourse: {},
    totalXP: 0,
    streak: defaultStreak(),
    achievementsBitmap: '0'.repeat(64)
  };
}

function emptyStore(): LearningStoreData {
  return {
    users: {},
    txHistory: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNumberList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<number>();
  value.forEach((item) => {
    const parsed = Number(item);
    if (Number.isInteger(parsed) && parsed >= 0) {
      unique.add(parsed);
    }
  });

  return [...unique].sort((a, b) => a - b);
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  value.forEach((item) => {
    if (typeof item === 'string' && item.trim().length > 0) {
      unique.add(item.trim());
    }
  });

  return [...unique];
}

function normalizeProgressMap(value: unknown): Record<string, number[]> {
  if (!isRecord(value)) {
    return {};
  }

  const map: Record<string, number[]> = {};
  Object.entries(value).forEach(([courseId, indexes]) => {
    map[courseId] = normalizeNumberList(indexes);
  });
  return map;
}

function normalizeCourseXpMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  const map: Record<string, number> = {};
  Object.entries(value).forEach(([courseId, xp]) => {
    const parsed = Number(xp);
    map[courseId] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  });
  return map;
}

function normalizeStreak(value: unknown): StreakData {
  if (!isRecord(value)) {
    return defaultStreak();
  }

  const current = Number(value.current);
  const longest = Number(value.longest);
  const lastActiveDate = typeof value.lastActiveDate === 'string' ? value.lastActiveDate : '';

  return {
    current: Number.isFinite(current) && current >= 0 ? Math.floor(current) : 0,
    longest: Number.isFinite(longest) && longest >= 0 ? Math.floor(longest) : 0,
    lastActiveDate,
    activeDates: normalizeStringList(value.activeDates)
  };
}

function normalizeUserState(value: unknown): LearningUserState {
  if (!isRecord(value)) {
    return defaultUserState();
  }

  const totalXP = Number(value.totalXP);
  const achievementsBitmap =
    typeof value.achievementsBitmap === 'string' && value.achievementsBitmap.length > 0
      ? value.achievementsBitmap
      : '0'.repeat(64);

  return {
    enrollments: normalizeStringList(value.enrollments),
    progressByCourse: normalizeProgressMap(value.progressByCourse),
    xpByCourse: normalizeCourseXpMap(value.xpByCourse),
    totalXP: Number.isFinite(totalXP) && totalXP > 0 ? Math.floor(totalXP) : 0,
    streak: normalizeStreak(value.streak),
    achievementsBitmap
  };
}

function normalizeTxRecord(value: unknown): LearningTxRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const action = value.action;
  if (action !== 'enroll_course' && action !== 'complete_lesson') {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.courseId !== 'string' ||
    typeof value.signature !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }

  const rawLessonIndex = value.lessonIndex;
  const lessonIndex = Number(rawLessonIndex);

  return {
    id: value.id,
    userId: value.userId,
    action,
    courseId: value.courseId,
    lessonIndex: Number.isInteger(lessonIndex) && lessonIndex >= 0 ? lessonIndex : undefined,
    signature: value.signature,
    createdAt: value.createdAt
  };
}

async function ensureStoreFile(): Promise<void> {
  const dir = dirname(STORE_PATH);
  await mkdir(dir, { recursive: true });

  try {
    await readFile(STORE_PATH, 'utf-8');
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(emptyStore(), null, 2), 'utf-8');
  }
}

async function readStore(): Promise<LearningStoreData> {
  await ensureStoreFile();

  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed)) {
      return emptyStore();
    }

    const usersRaw = isRecord(parsed.users) ? parsed.users : {};
    const users: Record<string, LearningUserState> = {};

    Object.entries(usersRaw).forEach(([userId, state]) => {
      users[userId] = normalizeUserState(state);
    });

    const txRaw = Array.isArray(parsed.txHistory) ? parsed.txHistory : [];
    const txHistory = txRaw
      .map((item) => normalizeTxRecord(item))
      .filter((item): item is LearningTxRecord => item !== null);

    return {
      users,
      txHistory
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: LearningStoreData): Promise<void> {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

async function mutateStore<T>(mutator: (store: LearningStoreData) => T): Promise<T> {
  const store = await readStore();
  const result = mutator(store);
  await writeStore(store);
  return result;
}

function userState(store: LearningStoreData, userId: string): LearningUserState {
  return store.users[userId] ?? defaultUserState();
}

function ensureUserState(store: LearningStoreData, userId: string): LearningUserState {
  if (!store.users[userId]) {
    store.users[userId] = defaultUserState();
  }

  return store.users[userId];
}

function compactIdentifier(value: string): string {
  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function parseLeaderboardAliases(): Map<string, string> {
  const raw = process.env.NEXT_PUBLIC_LEADERBOARD_ALIASES ?? '';
  const aliases = new Map<string, string>();

  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [id, alias] = entry.split(':').map((item) => item.trim());
      if (id && alias) {
        aliases.set(id, alias);
      }
    });

  return aliases;
}

function timeframeMultiplier(timeframe: Timeframe): number {
  if (timeframe === 'alltime') {
    return 1;
  }

  if (timeframe === 'monthly') {
    return 0.65;
  }

  return 0.3;
}

function computeProgress(
  input: {
    userId: string;
    courseId: string;
    state: LearningUserState;
  },
  totalLessons: number
): Progress {
  const completedLessonIndexes = input.state.progressByCourse[input.courseId] ?? [];
  const safeTotal = Number.isInteger(totalLessons) && totalLessons > 0 ? totalLessons : 0;

  return {
    userId: input.userId,
    courseId: input.courseId,
    completedLessonIndexes,
    percentage: safeTotal > 0 ? Math.round((completedLessonIndexes.length / safeTotal) * 100) : 0,
    xpEarned: input.state.xpByCourse[input.courseId] ?? completedLessonIndexes.length * 40
  };
}

function applyStreakActivity(streak: StreakData, activityDate: string): StreakData {
  if (streak.lastActiveDate === activityDate) {
    return streak;
  }

  const nextCurrent = isConsecutiveDate(streak.lastActiveDate, activityDate)
    ? streak.current + 1
    : 1;

  const nextLongest = Math.max(streak.longest, nextCurrent);
  const nextActiveDates = [activityDate, ...streak.activeDates.filter((date) => date !== activityDate)].slice(0, 60);

  return {
    current: nextCurrent,
    longest: nextLongest,
    lastActiveDate: activityDate,
    activeDates: nextActiveDates
  };
}

function syntheticSignature(seed: string): string {
  const digest = createHash('sha256').update(seed).digest('hex');
  return digest;
}

export async function getStoredProgress(
  userId: string,
  courseId: string,
  totalLessons: number
): Promise<Progress> {
  const store = await readStore();
  const state = userState(store, userId);
  return computeProgress({ userId, courseId, state }, totalLessons);
}

export async function getStoredEnrollment(userId: string, courseId: string): Promise<boolean> {
  const store = await readStore();
  const state = userState(store, userId);
  return state.enrollments.includes(courseId);
}

export async function getStoredXP(userId: string): Promise<number> {
  const store = await readStore();
  const state = userState(store, userId);
  return state.totalXP;
}

export async function getStoredStreak(userId: string): Promise<StreakData> {
  const store = await readStore();
  const state = userState(store, userId);
  return state.streak;
}

export async function getStoredLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
  const store = await readStore();
  const aliases = parseLeaderboardAliases();
  const multiplier = timeframeMultiplier(timeframe);

  return Object.entries(store.users)
    .map(([userId, state]) => {
      const adjustedXP = Math.floor(state.totalXP * multiplier);
      return {
        userId,
        username: aliases.get(userId) ?? compactIdentifier(userId),
        avatarUrl: '/avatars/default.png',
        xp: adjustedXP,
        level: levelFromXP(adjustedXP),
        streak: state.streak.current
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));
}

export async function recordEnrollment(userId: string, courseId: string): Promise<boolean> {
  return mutateStore((store) => {
    const state = ensureUserState(store, userId);
    if (state.enrollments.includes(courseId)) {
      return false;
    }

    state.enrollments = [...state.enrollments, courseId];
    return true;
  });
}

export async function recordLessonCompletion(input: {
  userId: string;
  courseId: string;
  lessonIndex: number;
  xpAward: number;
}): Promise<LessonCompletionResult> {
  return mutateStore((store) => {
    const state = ensureUserState(store, input.userId);

    if (!state.enrollments.includes(input.courseId)) {
      state.enrollments = [...state.enrollments, input.courseId];
    }

    const completed = state.progressByCourse[input.courseId] ?? [];
    if (completed.includes(input.lessonIndex)) {
      return {
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXP: state.totalXP,
        streak: state.streak
      };
    }

    const xpAward = Number.isFinite(input.xpAward) && input.xpAward > 0 ? Math.floor(input.xpAward) : 40;

    state.progressByCourse[input.courseId] = [...completed, input.lessonIndex].sort((a, b) => a - b);
    state.xpByCourse[input.courseId] = (state.xpByCourse[input.courseId] ?? 0) + xpAward;
    state.totalXP += xpAward;
    state.streak = applyStreakActivity(state.streak, todayIso());

    return {
      alreadyCompleted: false,
      xpAwarded: xpAward,
      totalXP: state.totalXP,
      streak: state.streak
    };
  });
}

export async function appendTxRecord(input: {
  userId: string;
  action: LearningTxRecord['action'];
  courseId: string;
  lessonIndex?: number;
}): Promise<LearningTxRecord> {
  return mutateStore((store) => {
    const payload = `${input.userId}:${input.action}:${input.courseId}:${input.lessonIndex ?? ''}:${nowIso()}:${randomUUID()}`;

    const record: LearningTxRecord = {
      id: randomUUID(),
      userId: input.userId,
      action: input.action,
      courseId: input.courseId,
      lessonIndex: input.lessonIndex,
      signature: syntheticSignature(payload),
      createdAt: nowIso()
    };

    store.txHistory = [record, ...store.txHistory].slice(0, 3000);
    return record;
  });
}
