import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  fetchXpBalance,
  fetchAllCourses,
  fetchEnrollment,
  countCompletedLessons,
  getCompletedLessonIndices,
  calculateLevel,
  getConnection,
  XP_MINT,
} from '@/lib/solana';
import { fetchCredentials, fetchLeaderboard } from '@/lib/solana/credentials';
import { StreakService } from './streak';
import type {
  LessonProgress,
  LeaderboardEntry,
  Credential,
  Course,
  TimeFrame,
} from '@/types';

export class LearningProgressService {
  private connection: Connection;

  constructor(connection?: Connection) {
    this.connection = connection || getConnection();
  }

  /** Get lesson progress for a wallet in a specific course */
  async getProgress(
    courseId: string,
    wallet: PublicKey
  ): Promise<LessonProgress | null> {
    const enrollment = await fetchEnrollment(this.connection, courseId, wallet);
    if (!enrollment) return null;

    const courses = await fetchAllCourses(this.connection);
    const course = courses.find((c) => c.account.courseId === courseId);
    const totalLessons = course?.account.lessonCount || 0;
    const completedLessons = getCompletedLessonIndices(
      enrollment.lessonFlags,
      totalLessons
    );

    return {
      courseId,
      completedLessons,
      totalLessons,
      completedAt: enrollment.completedAt?.toNumber() ?? null,
      enrolledAt: enrollment.enrolledAt.toNumber(),
      progressPercent:
        totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0,
    };
  }

  /**
   * Complete a lesson — STUB
   * In production, this calls the backend API which co-signs the transaction.
   */
  async completeLesson(
    courseId: string,
    lessonIndex: number,
    _wallet: PublicKey
  ): Promise<{ success: boolean; txSignature?: string }> {
    console.log(
      `[STUB] completeLesson: course=${courseId}, lesson=${lessonIndex}`
    );
    // TODO: POST to backend API endpoint
    // The backend validates content completion, then signs and submits
    // the complete_lesson transaction
    return { success: false };
  }

  /** Get XP balance for a wallet */
  async getXp(wallet: PublicKey): Promise<number> {
    return fetchXpBalance(this.connection, wallet);
  }

  /** Get streak data (frontend-only, localStorage) */
  getStreak(wallet: string) {
    return StreakService.getStreak(wallet);
  }

  /** Record activity for streak tracking */
  recordActivity(wallet: string) {
    StreakService.recordActivity(wallet);
  }

  /** Get leaderboard */
  async getLeaderboard(
    _timeFrame: TimeFrame = 'all-time',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    // Note: time-based filtering would need backend indexing
    // For now, we return all-time leaderboard from token holders
    const entries = await fetchLeaderboard(XP_MINT.toBase58(), limit);

    return entries.map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet,
      xp: entry.xp,
      level: calculateLevel(entry.xp),
      credentialCount: 0, // Would need DAS query per wallet
    }));
  }

  /** Get credentials for a wallet */
  async getCredentials(wallet: string): Promise<Credential[]> {
    return fetchCredentials(wallet);
  }
}

/** Singleton instance */
let _instance: LearningProgressService | null = null;

export function getLearningProgressService(): LearningProgressService {
  if (!_instance) {
    _instance = new LearningProgressService();
  }
  return _instance;
}
