import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
  TransactionResult,
  LessonCompletionResult,
  CourseFinalizationResult,
} from "@/types";
import type { LearningProgressService } from "./learning-progress";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Client-side implementation of LearningProgressService.
 * Auth is handled via Privy's `privy-id-token` cookie (sent automatically by the browser).
 */
export class ApiProgressService implements LearningProgressService {
  async getProgress(
    _userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    return apiFetch<Progress | null>(`/api/progress?courseId=${courseId}`);
  }

  async getAllProgress(_userId: string): Promise<Progress[]> {
    return apiFetch<Progress[]>("/api/progress");
  }

  async completeLesson(
    _userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<LessonCompletionResult> {
    return apiFetch<LessonCompletionResult>("/api/progress", {
      method: "POST",
      body: JSON.stringify({ courseId, lessonIndex }),
    });
  }

  async enrollInCourse(
    _userId: string,
    courseId: string,
  ): Promise<TransactionResult> {
    return apiFetch<TransactionResult>("/api/enrollment", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    });
  }

  async finalizeCourse(
    _userId: string,
    courseId: string,
  ): Promise<CourseFinalizationResult> {
    return apiFetch<CourseFinalizationResult>("/api/progress/finalize", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    });
  }

  async closeEnrollment(
    _userId: string,
    courseId: string,
  ): Promise<TransactionResult> {
    return apiFetch<TransactionResult>("/api/enrollment", {
      method: "DELETE",
      body: JSON.stringify({ courseId }),
    });
  }

  async getXP(_userId: string): Promise<number> {
    const user = await apiFetch<{ xp: number }>("/api/user");
    return user.xp;
  }

  async addXP(
    _userId: string,
    _amount: number,
  ): Promise<{ balance: number } & TransactionResult> {
    const user = await apiFetch<{ xp: number }>("/api/user");
    return { balance: user.xp };
  }

  async getStreak(_userId: string): Promise<StreakData> {
    const user = await apiFetch<{ streak: StreakData }>("/api/user");
    return user.streak;
  }

  async recordActivity(_userId: string): Promise<StreakData> {
    const user = await apiFetch<{ streak: StreakData }>("/api/user");
    return user.streak;
  }

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({ timeframe });
    if (courseId) params.set("courseId", courseId);
    return apiFetch<LeaderboardEntry[]>(`/api/leaderboard?${params}`);
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    return apiFetch<Credential[]>(`/api/credentials?wallet=${wallet}`);
  }

  async getAchievements(_userId: string): Promise<Achievement[]> {
    return apiFetch<Achievement[]>("/api/achievements");
  }

  async claimAchievement(
    _userId: string,
    achievementId: string,
  ): Promise<TransactionResult> {
    return apiFetch<TransactionResult>("/api/achievements", {
      method: "POST",
      body: JSON.stringify({ achievementId }),
    });
  }
}
