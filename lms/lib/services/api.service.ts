import type { LearningProgressService, CompleteLessonResult, OnChainResult, MarkSolutionResult, PracticeProgressData, ThreadListResult } from "./types";
import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";
import type { Thread, Reply, Endorsement, CommunityStats } from "@/types/community";

const BASE = "/api/learning";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
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

  async enrollInCourse(userId: string, courseId: string, txSignature?: string): Promise<OnChainResult> {
    return fetchJson(`${BASE}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, txSignature }),
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

  // Community

  async getThreads(params?: { type?: string; tag?: string; sort?: string; page?: number }): Promise<ThreadListResult> {
    const sp = new URLSearchParams();
    if (params?.type) sp.set("type", params.type);
    if (params?.tag) sp.set("tag", params.tag);
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.page) sp.set("page", String(params.page));
    return fetchJson(`/api/community/threads?${sp.toString()}`);
  }

  async getThread(id: string): Promise<Thread> {
    return fetchJson(`/api/community/threads/${id}`);
  }

  async createThread(userId: string, title: string, body: string, type: string, tags: string[], bountyLamports?: number): Promise<OnChainResult & { thread: Thread }> {
    return fetchJson("/api/community/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, body, type, tags, ...(bountyLamports && bountyLamports > 0 && { bountyLamports }) }),
    });
  }

  async getReplies(threadId: string): Promise<Reply[]> {
    return fetchJson(`/api/community/replies?threadId=${threadId}`);
  }

  async createReply(userId: string, threadId: string, body: string): Promise<OnChainResult & { reply: Reply }> {
    return fetchJson("/api/community/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, threadId, body }),
    });
  }

  async upvote(userId: string, targetId: string, targetType: "thread" | "reply"): Promise<{ ok: boolean; upvotes: string[] }> {
    return fetchJson("/api/community/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetId, targetType }),
    });
  }

  async markSolution(userId: string, threadId: string, replyId: string): Promise<MarkSolutionResult> {
    return fetchJson("/api/community/mark-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, threadId, replyId }),
    });
  }

  async getEndorsements(wallet: string): Promise<Endorsement[]> {
    return fetchJson(`/api/community/endorsements?wallet=${wallet}`);
  }

  async endorseUser(endorser: string, endorsee: string, message?: string): Promise<OnChainResult> {
    return fetchJson("/api/community/endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endorser, endorsee, message }),
    });
  }

  async getCommunityStats(userId: string): Promise<CommunityStats> {
    return fetchJson(`/api/community/points?userId=${userId}`);
  }
}
