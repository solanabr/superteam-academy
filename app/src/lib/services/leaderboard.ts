import type { LeaderboardEntry } from "./types";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
}

export async function getLeaderboard(
  timeframe: "weekly" | "monthly" | "alltime",
  page = 1,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(
      `/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=${limit}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Support both old flat-array and new paginated response
    if (Array.isArray(data)) return data;
    return (data as LeaderboardResponse).entries ?? [];
  } catch (error) {
    console.error("[leaderboard] Failed to fetch leaderboard:", error);
    return [];
  }
}

export async function getLeaderboardPaginated(
  timeframe: "weekly" | "monthly" | "alltime",
  page = 1,
  limit = 50,
): Promise<LeaderboardResponse> {
  try {
    const res = await fetch(
      `/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=${limit}`,
    );
    if (!res.ok) return { entries: [], page, limit, total: 0 };
    const data = await res.json();
    if (Array.isArray(data)) {
      return { entries: data, page: 1, limit: data.length, total: data.length };
    }
    return data as LeaderboardResponse;
  } catch (error) {
    console.error("[leaderboard] Failed to fetch paginated leaderboard:", error);
    return { entries: [], page, limit, total: 0 };
  }
}
