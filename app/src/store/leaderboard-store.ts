import { create } from "zustand";
import type { LeaderboardEntry } from "@/lib/learning-progress/types";

type LeaderboardState = {
    entries: Record<string, LeaderboardEntry[]>;
    pages: Record<string, number>;
    hasMore: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;

    abortControllers: Record<string, AbortController>;
    fetchLeaderboard: (timeframe: "daily" | "weekly" | "all-time", courseId?: string, page?: number) => Promise<void>;
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
    pages: {
        "daily": 1,
        "weekly": 1,
        "all-time": 1
    },
    hasMore: {
        "daily": true,
        "weekly": true,
        "all-time": true
    },
    abortControllers: {},
    isLoading: false,
    error: null,
};

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
    ...initialState,

    setLoading: (isLoading) => set({ isLoading }),

    getError: (error: string | null) => set({ error }),

    fetchLeaderboard: async (timeframe, courseId, page = 1) => {
        const state = get();
        const cacheKey = `${timeframe}${courseId ? `:${courseId}` : ""}`;

        // 1. Abort existing request for this specific key if it exists
        if (state.abortControllers[cacheKey]) {
            state.abortControllers[cacheKey].abort();
        }

        // 2. Create new controller
        const controller = new AbortController();
        set((s) => ({
            abortControllers: { ...s.abortControllers, [cacheKey]: controller }
        }));

        const isInitial = page === 1 && (!state.entries[cacheKey] || state.entries[cacheKey].length === 0);
        if (isInitial) set({ isLoading: true });

        try {
            const url = new URL("/api/leaderboard", window.location.origin);
            url.searchParams.append("timeframe", timeframe);
            if (courseId) url.searchParams.append("courseId", courseId);
            url.searchParams.append("page", page.toString());
            url.searchParams.append("limit", "10");

            const res = await fetch(url.toString(), { signal: controller.signal });
            if (!res.ok) throw new Error("Failed to fetch leaderboard");

            const data = await res.json();
            const hasMore = data.length === 10;

            set((s) => {
                const prevEntries = s.entries[cacheKey] || [];
                const newEntries = page === 1 ? data : [...prevEntries, ...data];

                return {
                    entries: {
                        ...s.entries,
                        [cacheKey]: newEntries
                    },
                    pages: {
                        ...s.pages,
                        [cacheKey]: page
                    },
                    hasMore: {
                        ...s.hasMore,
                        [cacheKey]: hasMore
                    },
                    error: null
                };
            });
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Ignore cancellations

            set({
                error: error instanceof Error ? error.message : "Failed to fetch leaderboard",
            });
        } finally {
            set({ isLoading: false });
            // Clean up controller after completion
            set((s) => {
                const newControllers = { ...s.abortControllers };
                delete newControllers[cacheKey];
                return { abortControllers: newControllers };
            });
        }
    },

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
