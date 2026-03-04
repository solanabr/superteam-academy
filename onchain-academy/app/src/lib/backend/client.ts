import {
  ActivityItem,
  EnrollmentRecord,
  ProfileRecord,
  ProfileVisibilityRecord,
  ProgressRecord,
  ProgressSummary,
  StreakSummary,
} from "./types";
import { LeaderboardWindow } from "@/services/contracts";
import { LeaderboardEntry } from "@/domain/models";

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const backendClient = {
  async getEnrollment(learnerId: string, courseId: string) {
    const response = await fetch(`/api/enrollments?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<{ enrolled: boolean; enrollment?: EnrollmentRecord }>(response);
  },
  async upsertEnrollment(payload: EnrollmentRecord) {
    const response = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseJson<{ ok: boolean; enrollment: EnrollmentRecord }>(response);
  },
  async getProgress(learnerId: string, courseId: string) {
    const response = await fetch(`/api/progress?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<ProgressSummary | null>(response);
  },
  async completeLesson(payload: ProgressRecord) {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseJson<ProgressSummary>(response);
  },
  async getStreak(learnerId: string) {
    const response = await fetch(`/api/streak?learnerId=${encodeURIComponent(learnerId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<StreakSummary>(response);
  },
  async getActivity(learnerId: string) {
    const response = await fetch(`/api/activity?learnerId=${encodeURIComponent(learnerId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<ActivityItem[]>(response);
  },
  async getLeaderboard(window: LeaderboardWindow, courseId?: string | null) {
    const courseParam = courseId ? `&courseId=${encodeURIComponent(courseId)}` : "";
    const response = await fetch(`/api/leaderboard?window=${encodeURIComponent(window)}${courseParam}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<LeaderboardEntry[]>(response);
  },
  async getProfile(learnerId: string) {
    const response = await fetch(`/api/profile?learnerId=${encodeURIComponent(learnerId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<ProfileRecord>(response);
  },
  async upsertProfile(payload: {
    learnerId: string;
    displayName?: string;
    email?: string | null;
    walletAddress?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    country?: string;
    role?: string;
  }) {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseJson<{ ok: boolean; profile: ProfileRecord; error?: string }>(response);
  },
  async getProfileVisibility(learnerId: string) {
    const response = await fetch(`/api/profile-visibility?learnerId=${encodeURIComponent(learnerId)}`, {
      method: "GET",
      cache: "no-store",
    });
    return parseJson<ProfileVisibilityRecord>(response);
  },
  async upsertProfileVisibility(payload: { learnerId: string; isPublic: boolean }) {
    const response = await fetch("/api/profile-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseJson<ProfileVisibilityRecord>(response);
  },
};
