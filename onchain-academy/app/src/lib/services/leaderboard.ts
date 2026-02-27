import type { LeaderboardEntry } from "./types";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
  timeframe?: string;
  snapshotDataAvailable?: boolean;
}

export async function getLeaderboard(
  timeframe: "weekly" | "monthly" | "alltime",
  page = 1,
  limit = 50,
): Promise<{ entries: LeaderboardEntry[]; snapshotDataAvailable: boolean }> {
  try {
    const res = await fetch(
      `/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=${limit}`,
    );
    if (!res.ok) return { entries: [], snapshotDataAvailable: true };
    const data = await res.json();
    if (Array.isArray(data)) return { entries: data, snapshotDataAvailable: true };
    const resp = data as LeaderboardResponse;
    return {
      entries: resp.entries ?? [],
      snapshotDataAvailable: resp.snapshotDataAvailable ?? true,
    };
  } catch (error) {
    console.error("[leaderboard] Failed to fetch leaderboard:", error);
    return { entries: [], snapshotDataAvailable: true };
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
