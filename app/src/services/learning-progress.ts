import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getConnection } from "@/lib/solana";
import { findEnrollmentPDA, findCoursePDA } from "@/lib/pda";
import { getCompletedLessonIndices } from "@/lib/bitmap";
import type {
  CourseProgress,
  TxResult,
  LeaderboardEntry,
  StreakData,
  Credential,
} from "@/types";
import { xpToLevel } from "@/types";
import { fetchXpBalance, fetchAllXpBalances } from "@/lib/solana";
import { getCredentials } from "./credentials";
import { getStreakData, recordActivity } from "./streak";
import { getLeaderboard } from "./leaderboard";

export interface LearningProgressService {
  getProgress(walletAddress: string, courseId: string): Promise<CourseProgress>;
  completeLesson(courseId: string, lessonIndex: number): Promise<TxResult>;
  getXpBalance(walletAddress: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export async function getProgress(
  walletAddress: string,
  courseId: string
): Promise<CourseProgress> {
  try {
    const learner = new PublicKey(walletAddress);
    const [enrollmentPda] = findEnrollmentPDA(courseId, learner);
    const [coursePda] = findCoursePDA(courseId);

    const conn = getConnection();

    // Fetch on-chain accounts
    const [enrollmentInfo, courseInfo] = await Promise.all([
      conn.getAccountInfo(enrollmentPda),
      conn.getAccountInfo(coursePda),
    ]);

    if (!enrollmentInfo) {
      return {
        courseId,
        enrolled: false,
        completedLessons: [],
        totalLessons: 0,
        percentComplete: 0,
        isFinalized: false,
      };
    }

    // Decode enrollment — layout: discriminator(8) + courseId(32) + learner(32) + flags(32) + enrolled_at(8) + completed_at(9) + credential_asset(33) + bump(1)
    const data = enrollmentInfo.data;
    const lessonFlags: BN[] = [];
    for (let i = 0; i < 4; i++) {
      const offset = 8 + 32 + 32 + i * 8;
      lessonFlags.push(new BN(data.slice(offset, offset + 8), "le"));
    }

    const completedAtOffset = 8 + 32 + 32 + 32 + 8;
    const hasCompletedAt = data[completedAtOffset] === 1;

    const credentialOffset = completedAtOffset + 9;
    const hasCredential = data[credentialOffset] === 1;
    const credentialAsset = hasCredential
      ? new PublicKey(data.slice(credentialOffset + 1, credentialOffset + 33)).toBase58()
      : undefined;

    // Decode lesson count from course
    let totalLessons = 0;
    if (courseInfo) {
      const courseData = courseInfo.data;
      // lesson_count is u8 at offset: discriminator(8) + course_id_len(4) + course_id_data(32 max) + creator(32) + content_tx_id(32) + difficulty(1) = let anchor auto-decode
      // For now, scan bitmap for approximate lesson count
      totalLessons = lessonFlags.reduce((sum, word) => {
        if (word.isZero()) return sum;
        return sum + 64; // rough estimate
      }, 0);
      // Better: use the account directly from a Program fetch — but that requires AnchorProvider
      // We'll default to checking the bitmap only
    }

    const completedLessons = getCompletedLessonIndices(lessonFlags, Math.max(totalLessons, 64));
    const percentComplete = totalLessons > 0
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0;

    return {
      courseId,
      enrolled: true,
      completedLessons,
      totalLessons,
      percentComplete,
      isFinalized: hasCompletedAt,
      credentialAsset,
    };
  } catch {
    return {
      courseId,
      enrolled: false,
      completedLessons: [],
      totalLessons: 0,
      percentComplete: 0,
      isFinalized: false,
    };
  }
}

/** Lesson completion is backend-signed — POST to /api/lessons/complete */
export async function completeLesson(
  courseId: string,
  lessonIndex: number
): Promise<TxResult> {
  try {
    const res = await fetch("/api/lessons/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, lessonIndex }),
    });
    const json = await res.json() as { signature?: string; error?: string };
    if (!res.ok) {
      return { success: false, error: json.error ?? "Unknown error" };
    }
    return { success: true, signature: json.signature };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export { fetchXpBalance as getXpBalance };
export { getStreakData, recordActivity };
export { getLeaderboard };
export { getCredentials };
