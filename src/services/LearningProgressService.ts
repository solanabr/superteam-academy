/**
 * LearningProgressService
 *
 * Clean service abstraction for all learning-progress operations.
 * The stub implementation uses localStorage for persistence.
 * Swap the implementation for on-chain calls without changing callers.
 */
import { getCurrentStreak, getStreakHeatmap, markLearningActivityToday } from "@/lib/streak";

/** ── Types ──────────────────────────────────────────────────────────── */
export interface EnrollmentProgress {
  courseId: string;
  wallet: string;
  lessonFlags: number[];       // 256-bit bitmap (as bytes)
  completedLessons: number;
  totalLessons: number;
  pct: number;                  // 0–100
  completedAt: number | null;   // unix ms
}

export interface XpBalance {
  amount: number;
  level: number;
}

export interface StreakDay {
  date: string;   // ISO YYYY-MM-DD
  active: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  days: StreakDay[];
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string | null;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  id: string;
  courseId: string;
  courseName: string;
  mintAddress: string | null;
  issuedAt: number;
  explorerUrl: string;
  isStub: boolean;
}

export type Timeframe = "weekly" | "monthly" | "all-time";

/** ── Service Interface ───────────────────────────────────────────────── */
export interface ILearningProgressService {
  getProgress(wallet: string, courseId: string): Promise<EnrollmentProgress | null>;
  completeLesson(wallet: string, courseId: string, lessonIndex: number): Promise<void>;
  getXpBalance(wallet: string): Promise<XpBalance>;
  getStreakData(wallet: string): Promise<StreakData>;
  getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  recordDailyActivity(wallet: string): Promise<void>;
}

/** ── Stub Implementation (localStorage-backed) ───────────────────────── */
function storageKey(ns: string, wallet: string) {
  return `academy_svc_${ns}_${wallet.slice(0, 8)}`;
}

export class StubLearningProgressService implements ILearningProgressService {
  async getProgress(wallet: string, courseId: string): Promise<EnrollmentProgress | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(storageKey(`progress_${courseId}`, wallet));
    if (!raw) return null;
    return JSON.parse(raw) as EnrollmentProgress;
  }

  async completeLesson(wallet: string, courseId: string, lessonIndex: number): Promise<void> {
    if (typeof window === "undefined") return;
    const key = storageKey(`progress_${courseId}`, wallet);
    const existing: EnrollmentProgress = JSON.parse(localStorage.getItem(key) ?? "null") ?? {
      courseId,
      wallet,
      lessonFlags: new Array(32).fill(0),
      completedLessons: 0,
      totalLessons: 0,
      pct: 0,
      completedAt: null,
    };
    const byteIndex = Math.floor(lessonIndex / 8);
    const bitIndex = lessonIndex % 8;
    existing.lessonFlags[byteIndex] |= 1 << bitIndex;
    existing.completedLessons = existing.lessonFlags.reduce(
      (sum, b) => sum + popcount(b), 0
    );
    if (existing.totalLessons > 0 && existing.completedLessons >= existing.totalLessons) {
      existing.completedAt = Date.now();
    }
    localStorage.setItem(key, JSON.stringify(existing));
    await this.recordDailyActivity(wallet);
  }

  async getXpBalance(wallet: string): Promise<XpBalance> {
    if (typeof window === "undefined") return { amount: 0, level: 0 };
    const amount = Number(localStorage.getItem(storageKey("xp", wallet)) ?? 0);
    const level = Math.floor(Math.sqrt(amount / 100));
    return { amount, level };
  }

  async getStreakData(wallet: string): Promise<StreakData> {
    void wallet;
    if (typeof window === "undefined") {
      return { currentStreak: 0, longestStreak: 0, days: [] };
    }
    const flags = getStreakHeatmap(70);
    const days: StreakDay[] = flags.map((active, i) => ({
      date: daysAgo(i),
      active,
    }));
    const currentStreak = getCurrentStreak(70);
    let longestStreak = 0;
    let run = 0;
    for (const d of days) {
      if (d.active) { run++; longestStreak = Math.max(longestStreak, run); }
      else run = 0;
    }
    return { currentStreak, longestStreak, days };
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    void timeframe;
    // Stub: returns demo data. Real implementation indexes XP token accounts.
    return DEMO_LEADERBOARD;
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(storageKey("credentials", wallet));
    return raw ? JSON.parse(raw) : [];
  }

  async recordDailyActivity(wallet: string): Promise<void> {
    if (typeof window === "undefined") return;
    void wallet;
    markLearningActivityToday();
  }
}

/** ── Helpers ────────────────────────────────────────────────────────── */
function popcount(byte: number): number {
  let count = 0;
  while (byte) { count += byte & 1; byte >>= 1; }
  return count;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0]!;
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, wallet: "4bz6Rr...xQ9K", displayName: "Ana Souza", xp: 4800, level: 6, streak: 21 },
  { rank: 2, wallet: "9mLpW2...Hj3F", displayName: "Carlos Mendes", xp: 3200, level: 5, streak: 14 },
  { rank: 3, wallet: "BsK7nY...pT2A", displayName: "Beatriz Lima", xp: 2100, level: 4, streak: 7 },
  { rank: 4, wallet: "Qm5xB8...rW6E", displayName: "Rafael Costa", xp: 1500, level: 3, streak: 5 },
  { rank: 5, wallet: "Ln3vZ1...cJ7T", displayName: "Mariana Silva", xp: 1200, level: 3, streak: 3 },
];

/** ── Singleton factory ────────────────────────────────────────────────── */
let _service: ILearningProgressService | null = null;

export function getLearningProgressService(): ILearningProgressService {
  if (!_service) {
    // In future: check env for "onchain" and return real implementation
    _service = new StubLearningProgressService();
  }
  return _service;
}
