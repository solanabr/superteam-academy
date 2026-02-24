/**
 * LearningProgressService — unified abstraction for all learning-related
 * operations. Composes on-chain queries, local storage, and utility functions
 * into a single service interface for clean separation of concerns.
 *
 * Designed for future migration: swap the implementation (e.g. replace
 * localStorage streaks with on-chain streak tracking) without changing
 * consumers.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { type Idl, Program } from "@coral-xyz/anchor";
import BN from "bn.js";

import { IDL, getTypedAccounts, type RawCourseAccount } from "@/anchor/idl";
import type { CourseAccount } from "@/hooks/use-courses";
import type { EnrollmentAccount } from "@/hooks/use-enrollment";
import type { LeaderboardEntry } from "@/hooks/use-leaderboard";
import type { CredentialAsset } from "@/lib/credentials";
import { getCoursePda, getEnrollmentPda } from "@/lib/pda";
import { getXpBalance } from "@/lib/xp-token";
import { getLevel, getXpForNextLevel, getLevelProgress } from "@/lib/level";
import { isLessonComplete, countCompletedLessons, getCompletedLessonIndices } from "@/lib/bitmap";
import {
  getStreak, isActiveToday, recordActivity, getActivityHistory,
  getFreezeCount, addFreeze, getMilestones, getCalendarData,
  type StreakMilestone,
} from "@/lib/streak";
import { getCredentialsByOwner } from "@/lib/credentials";

// ── Service Interface ──────────────────────────────────────────────

export interface LearningProgressService {
  // ─ Courses ─
  getAllCourses(): Promise<CourseAccount[]>;
  getCourse(courseId: string): Promise<CourseAccount | null>;

  // ─ Enrollment & Progress ─
  getEnrollment(courseId: string, learner: PublicKey): Promise<EnrollmentAccount | null>;
  isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean;
  getCompletedLessonCount(lessonFlags: BN[]): number;
  getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[];

  // ─ XP & Levels ─
  getXpBalance(wallet: PublicKey): Promise<number>;
  getLevel(xp: number): number;
  getLevelProgress(xp: number): number;
  getXpForNextLevel(xp: number): number;

  // ─ Streaks ─
  getStreak(): number;
  isActiveToday(): boolean;
  recordActivity(): number;
  getActivityHistory(): string[];
  getFreezeCount(): number;
  addFreeze(count?: number): void;
  getMilestones(): StreakMilestone[];
  getCalendarData(days?: number): { date: string; active: boolean }[];

  // ─ Credentials ─
  getCredentials(wallet: string, trackCollection?: string): Promise<CredentialAsset[]>;

  // ─ Leaderboard ─
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

// ── Implementation ─────────────────────────────────────────────────

function mapRawCourse(publicKey: PublicKey, raw: RawCourseAccount): CourseAccount {
  return {
    publicKey: publicKey.toBase58(),
    courseId: raw.courseId,
    creator: raw.creator.toBase58(),
    lessonCount: raw.lessonCount,
    difficulty: raw.difficulty,
    xpPerLesson: raw.xpPerLesson,
    trackId: raw.trackId,
    trackLevel: raw.trackLevel,
    prerequisite: raw.prerequisite?.toBase58() ?? null,
    creatorRewardXp: raw.creatorRewardXp,
    totalCompletions: raw.totalCompletions,
    totalEnrollments: raw.totalEnrollments,
    isActive: raw.isActive,
    createdAt: raw.createdAt?.toNumber() ?? 0,
  };
}

export function createLearningProgressService(
  connection: Connection
): LearningProgressService {
  const program = new Program(IDL as Idl, { connection });
  const accounts = getTypedAccounts(program);

  return {
    // ─ Courses ─
    async getAllCourses() {
      const all = await accounts.course.all();
      return all
        .filter((c) => c.account.isActive)
        .map((c) => mapRawCourse(c.publicKey, c.account));
    },

    async getCourse(courseId: string) {
      const pda = getCoursePda(courseId);
      try {
        const raw = await accounts.course.fetch(pda);
        return mapRawCourse(pda, raw);
      } catch {
        return null;
      }
    },

    // ─ Enrollment & Progress ─
    async getEnrollment(courseId: string, learner: PublicKey) {
      const pda = getEnrollmentPda(courseId, learner);
      const enrollment = await accounts.enrollment.fetchNullable(pda);
      if (!enrollment) return null;
      return {
        course: enrollment.course.toBase58(),
        enrolledAt: enrollment.enrolledAt.toNumber(),
        completedAt: enrollment.completedAt?.toNumber() ?? null,
        lessonFlags: enrollment.lessonFlags as BN[],
        credentialAsset: enrollment.credentialAsset?.toBase58() ?? null,
      };
    },

    isLessonComplete,
    getCompletedLessonCount: countCompletedLessons,
    getCompletedLessonIndices,

    // ─ XP & Levels ─
    async getXpBalance(wallet: PublicKey) {
      return getXpBalance(connection, wallet);
    },
    getLevel,
    getLevelProgress,
    getXpForNextLevel,

    // ─ Streaks ─
    getStreak,
    isActiveToday,
    recordActivity,
    getActivityHistory,
    getFreezeCount,
    addFreeze,
    getMilestones,
    getCalendarData,

    // ─ Credentials ─
    async getCredentials(wallet: string, trackCollection?: string) {
      return getCredentialsByOwner(wallet, trackCollection);
    },

    // ─ Leaderboard ─
    async getLeaderboard() {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      return data as LeaderboardEntry[];
    },
  };
}
