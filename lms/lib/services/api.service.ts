import type { LearningProgressService, CompleteLessonResult, OnChainResult, PracticeProgressData } from "./types";
import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";

const BASE = "/api/learning";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  return res.json();
}

export class ApiService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<Progress | null> {
    return fetchJson(`${BASE}/progress/${courseId}?userId=${userId}`);
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    return fetchJson(`${BASE}/progress?userId=${userId}`);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<CompleteLessonResult> {
    return fetchJson(`${BASE}/complete-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, lessonIndex }),
    });
  }

  async enrollInCourse(userId: string, courseId: string): Promise<OnChainResult> {
    return fetchJson(`${BASE}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId }),
    });
  }

  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    await fetchJson(`${BASE}/unenroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId }),
    });
  }

  async getXP(userId: string): Promise<number> {
    return fetchJson(`${BASE}/xp?userId=${userId}`);
  }

  async getLevel(userId: string): Promise<number> {
    return fetchJson(`${BASE}/level?userId=${userId}`);
  }

  async getStreak(userId: string): Promise<StreakData> {
    return fetchJson(`${BASE}/streak?userId=${userId}`);
  }

  async getLeaderboard(_timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]> {
    return fetchJson(`${BASE}/leaderboard`);
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    return fetchJson(`${BASE}/credentials?wallet=${wallet}`);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return fetchJson(`${BASE}/achievements?userId=${userId}`);
  }

  async claimAchievement(userId: string, achievementId: number): Promise<OnChainResult> {
    return fetchJson(`${BASE}/achievements/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, achievementId }),
    });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return fetchJson(`${BASE}/profile?userId=${userId}`);
  }

  async getDisplayName(userId: string): Promise<string | null> {
    return fetchJson(`${BASE}/profile/display-name?userId=${userId}`);
  }

  async setDisplayName(userId: string, name: string): Promise<void> {
    await fetchJson(`${BASE}/profile/display-name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name }),
    });
  }

  async getBio(userId: string): Promise<string | null> {
    const profile = await this.getProfile(userId);
    return profile?.bio ?? null;
  }

  async setBio(userId: string, bio: string): Promise<void> {
    await fetchJson(`${BASE}/profile/display-name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bio }),
    });
  }

  async getCourses(): Promise<Course[]> {
    return fetchJson(`${BASE}/courses`);
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return fetchJson(`${BASE}/courses/${courseId}`);
  }

  async getPracticeProgress(userId: string): Promise<PracticeProgressData> {
    return fetchJson(`${BASE}/practice?userId=${userId}`);
  }

  async completePracticeChallenge(userId: string, challengeId: string, xpReward: number): Promise<OnChainResult> {
    return fetchJson(`${BASE}/practice/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, challengeId, xpReward }),
    });
  }
}
