import { fetchWithAuth } from "./api";

export interface LeaderboardUser {
    rank: number;
    userId: string;
    username: string | null;
    name: string | null;
    avatar: string | null;
    totalXP: number;
    level: number;
    progressPercent: number;
    currentStreak: number;
    lastActive: string | null;
}

export interface LeaderboardResponse {
    success: boolean;
    data: {
        period: string;
        rankings: LeaderboardUser[];
        currentUser: (LeaderboardUser & { rank: number }) | null;
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export const leaderboardApi = {
    /**
     * Get the XP leaderboard
     */
    async getLeaderboard(params?: { period?: "week" | "month" | "all"; page?: number; limit?: number }): Promise<LeaderboardResponse> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth<LeaderboardResponse>(`/leaderboard${qs}`, { method: "GET" });
    }
};
