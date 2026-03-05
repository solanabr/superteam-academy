import { Connection, PublicKey } from "@solana/web3.js";
import { apiFetch } from "@/lib/api-client";
import type {
  Credential,
  LeaderboardEntry,
  StreakData,
  Timeframe,
  UserCourseProgress,
  UserProgressSummary,
} from "@/types/domain";
import type {
  LearningProgressService,
  LessonCompletionInput,
} from "./interfaces";
import { onchainAcademyService } from "./onchain-academy-service";

class ApiLearningProgressService implements LearningProgressService {
  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<UserCourseProgress> {
    return apiFetch<UserCourseProgress>(
      `/progress/${courseId}?userId=${encodeURIComponent(userId)}`,
    );
  }

  async completeLesson(
    input: LessonCompletionInput,
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }> {
    return apiFetch<{
      status: "accepted";
      pendingBackendSigner: true;
      requestId: string;
    }>("/progress/lesson/complete", {
      method: "POST",
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  async finalizeCourse(
    input: { courseId: string },
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }> {
    return apiFetch<{
      status: "accepted";
      pendingBackendSigner: true;
      requestId: string;
    }>("/progress/course/finalize", {
      method: "POST",
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  async claimAchievement(
    input: {
      achievementTypeId: string;
    },
    token?: string,
  ): Promise<{
    status: "accepted";
    pendingBackendSigner: true;
    requestId: string;
  }> {
    return apiFetch<{
      status: "accepted";
      pendingBackendSigner: true;
      requestId: string;
    }>("/achievements/claim", {
      method: "POST",
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  async getXpBalance(
    walletAddress: string,
  ): Promise<{ xp: number; level: number }> {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
      "confirmed",
    );

    try {
      const onchainXp = await onchainAcademyService.fetchXpBalance(
        connection,
        new PublicKey(walletAddress),
      );
      if (onchainXp > 0) {
        return { xp: onchainXp, level: Math.floor(Math.sqrt(onchainXp / 100)) };
      }
    } catch {
      // fall through to backend fallback
    }

    try {
      const rows = await apiFetch<Array<{ xpEarned: number }>>(
        `/progress/user/${encodeURIComponent(walletAddress)}`,
      );
      const xp = rows.reduce((sum, row) => sum + (row.xpEarned ?? 0), 0);
      return { xp, level: Math.floor(Math.sqrt(xp / 100)) };
    } catch {
      return { xp: 0, level: 1 };
    }
  }

  async getStreak(userId: string): Promise<StreakData> {
    return apiFetch<StreakData>(`/streak/${encodeURIComponent(userId)}`);
  }

  async getLeaderboard(
    timeframe: Timeframe,
    courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    const query = new URLSearchParams({ timeframe });
    if (courseId) {
      query.set("courseId", courseId);
    }

    return apiFetch<LeaderboardEntry[]>(`/leaderboard?${query.toString()}`);
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    try {
      return await apiFetch<Credential[]>(`/credentials/${walletAddress}`);
    } catch {
      return onchainAcademyService.fetchCredentials(walletAddress);
    }
  }

  async getUserAllProgress(userId: string): Promise<UserProgressSummary[]> {
    return apiFetch<UserProgressSummary[]>(
      `/progress/user/${encodeURIComponent(userId)}`,
    );
  }
}

export const learningProgressService: LearningProgressService =
  new ApiLearningProgressService();
