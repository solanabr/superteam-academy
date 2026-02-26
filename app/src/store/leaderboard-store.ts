import { create } from "zustand";
import type { LeaderboardEntry } from "@/lib/learning-progress/types";

type LeaderboardState = {
    entries: Record<string, LeaderboardEntry[]>;
    isLoading: boolean;
    error: string | null;

    fetchLeaderboard: (timeframe: "daily" | "weekly" | "all-time", courseId?: string) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
};

const initialState = {
    entries: {
        "daily": [],
        "weekly": [],
        "all-time": []
    },
    isLoading: false,
    error: null,
};

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
    ...initialState,

    setLoading: (isLoading) => set({ isLoading }),

    getError: (error: string | null) => set({ error }),

    fetchLeaderboard: async (timeframe, courseId) => {
        const state = get();
        const cacheKey = `${timeframe}${courseId ? `:${courseId}` : ""}`;

        // If we already have data, we might want to refresh it in the background
        // but for now, let's just mark loading if empty
        const isInitial = !state.entries[cacheKey] || state.entries[cacheKey].length === 0;
        if (isInitial) set({ isLoading: true });

        try {
            const url = new URL("/api/leaderboard", window.location.origin);
            url.searchParams.append("timeframe", timeframe);
            if (courseId) url.searchParams.append("courseId", courseId);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Failed to fetch leaderboard");

            const data = await res.json();
            set((s) => ({
                entries: {
                    ...s.entries,
                    [cacheKey]: data || []
                },
                error: null
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch leaderboard",
            });
        } finally {
            set({ isLoading: false });
        }
    },

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
