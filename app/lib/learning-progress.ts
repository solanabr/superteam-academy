/**
 * LearningProgressService
 *
 * Unified interface for tracking and querying learner progress across the platform.
 * Wraps on-chain enrollment data, XP calculations, streak tracking, and achievement
 * checking into a single service consumed by dashboard, profile, and API routes.
 */

import { PublicKey, Connection } from '@solana/web3.js';
import { calcLevel, xpToNextLevel, applyStreakMultiplier, checkAchievements, getLevelTitle, type Achievement, ACHIEVEMENTS } from './gamification';
import { getCourses, getCertificates } from './content';
import { getEnrollmentPDA, PROGRAM_ID } from './use-program';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LearnerProgress {
  /** Wallet address (base58) */
  address: string;
  /** Total accumulated XP */
  totalXP: number;
  /** Current level derived from XP */
  level: number;
  /** Human-readable level title (i18n) */
  levelTitle: string;
  /** XP progress within current level */
  xpInLevel: number;
  /** XP required to reach next level */
  xpForNextLevel: number;
  /** Current streak in days */
  streakDays: number;
  /** Streak multiplier label (e.g. "1.25x XP") */
  streakBonus: string;
  /** Course slugs the learner is enrolled in */
  enrolledCourses: string[];
  /** Completed lesson count per course */
  lessonProgress: Record<string, { completed: number; total: number }>;
  /** Unlocked achievement IDs */
  unlockedAchievements: string[];
  /** NFT credential count */
  credentialCount: number;
}

export interface CourseProgress {
  courseSlug: string;
  enrolled: boolean;
  lessonsCompleted: number;
  totalLessons: number;
  percentComplete: number;
  xpEarned: number;
  certificateEarned: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class LearningProgressService {
  private connection: Connection;

  constructor(rpcEndpoint?: string) {
    this.connection = new Connection(
      rpcEndpoint ?? process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com',
      'confirmed'
    );
  }

  /**
   * Check if a learner is enrolled in a specific course on-chain.
   */
  async isEnrolled(courseSlug: string, learnerPubkey: PublicKey): Promise<boolean> {
    try {
      const pda = getEnrollmentPDA(courseSlug, learnerPubkey);
      const info = await this.connection.getAccountInfo(pda);
      return info !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get enrollment status for all courses for a given learner.
   */
  async getEnrollments(learnerPubkey: PublicKey): Promise<string[]> {
    const courses = await getCourses();
    const enrolled: string[] = [];

    await Promise.all(
      courses.map(async (course) => {
        if (await this.isEnrolled(course.slug, learnerPubkey)) {
          enrolled.push(course.slug);
        }
      })
    );

    return enrolled;
  }

  /**
   * Get detailed progress for a specific course.
   */
  async getCourseProgress(
    courseSlug: string,
    learnerPubkey: PublicKey,
    lessonsCompleted: number,
    totalLessons: number,
    xpEarned: number,
  ): Promise<CourseProgress> {
    const enrolled = await this.isEnrolled(courseSlug, learnerPubkey);
    const certs = await getCertificates(learnerPubkey.toBase58());
    const hasCert = certs.some(c => c.courseSlug === courseSlug);

    return {
      courseSlug,
      enrolled,
      lessonsCompleted,
      totalLessons,
      percentComplete: totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0,
      xpEarned,
      certificateEarned: hasCert,
    };
  }

  /**
   * Build a complete learner progress snapshot.
   * This is the primary method consumed by the dashboard and profile pages.
   */
  async getFullProgress(
    address: string,
    totalXP: number,
    streakDays: number,
    completedLessons: number,
    completedCourses: number,
    challengesCompleted: number,
    rank: number,
    isEarlyAdopter: boolean,
    locale: string = 'pt-BR',
  ): Promise<LearnerProgress> {
    const pubkey = new PublicKey(address);
    const level = calcLevel(totalXP);
    const { current, required } = xpToNextLevel(totalXP);
    const enrolledCourses = await this.getEnrollments(pubkey);
    const certs = await getCertificates(address);
    const unlockedAchievements = checkAchievements(
      completedLessons, completedCourses, streakDays,
      challengesCompleted, rank, certs.length, isEarlyAdopter,
    );

    return {
      address,
      totalXP,
      level,
      levelTitle: getLevelTitle(level, locale),
      xpInLevel: current,
      xpForNextLevel: required,
      streakDays,
      streakBonus: streakDays >= 100 ? '2x XP' : streakDays >= 30 ? '1.5x XP' : streakDays >= 7 ? '1.25x XP' : '1x XP',
      enrolledCourses,
      lessonProgress: {}, // Populated by caller with per-course data
      unlockedAchievements,
      credentialCount: certs.length,
    };
  }

  /**
   * Calculate XP reward for completing a lesson, including streak bonus.
   */
  calculateLessonXP(baseXP: number, streakDays: number): number {
    return applyStreakMultiplier(baseXP, streakDays);
  }
}

/** Singleton instance for server-side usage */
export const learningProgress = new LearningProgressService();
