import { mockLeaderboard } from "@/domain/mock-data";
import { LeaderboardService, LeaderboardWindow } from "./contracts";

export const leaderboardService: LeaderboardService = {
  async getLeaderboard(window: LeaderboardWindow, courseId?: string | null) {
    const courseParam = courseId ? `&courseId=${encodeURIComponent(courseId)}` : "";
    const localApi = `/api/leaderboard?window=${encodeURIComponent(window)}${courseParam}`;
    const localResponse = await fetch(localApi, { cache: "no-store" });
    if (localResponse.ok) {
      return (await localResponse.json()) as typeof mockLeaderboard;
    }

    const endpoint = process.env.NEXT_PUBLIC_LEADERBOARD_API_URL;
    if (endpoint) {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as typeof mockLeaderboard;
      }
    }
    return mockLeaderboard;
  },
};
