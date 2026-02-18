import { create } from "zustand";

export type UserProfile = {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    [key: string]: any;
};

export type AppUser = {
    id: string;
    walletAddress: string;
    email?: string;
    role: "student" | "professor" | "admin";
    profile: UserProfile;
    createdAt: string;
};

export type UserProgress = {
    xp: number;
    level: number;
    rank: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
};

type UserState = {
    // User data
    user: AppUser | null;
    progress: UserProgress | null;

    // Loading states
    isLoading: boolean;
    isProgressLoading: boolean;

    // Error states
    error: string | null;
    progressError: string | null;

    // Actions
    setUser: (user: AppUser | null) => void;
    setProgress: (progress: UserProgress | null) => void;
    setLoading: (loading: boolean) => void;
    setProgressLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setProgressError: (error: string | null) => void;

    fetchUser: (walletAddress: string) => Promise<void>;
    fetchProgress: (walletAddress: string) => Promise<void>;
    updateXpOptimistic: (xpGain: number) => void;

    // Reset store
    reset: () => void;
};

const initialState = {
    user: null,
    progress: null,
    isLoading: false,
    isProgressLoading: false,
    error: null,
    progressError: null,
};

export const useUserStore = create<UserState>((set, get) => ({
    ...initialState,

    setUser: (user) => set({ user, error: null }),

    setProgress: (progress) => set({ progress, progressError: null }),

    setLoading: (isLoading) => set({ isLoading }),

    setProgressLoading: (isProgressLoading) => set({ isProgressLoading }),

    setError: (error) => set({ error }),

    setProgressError: (progressError) => set({ progressError }),

    fetchUser: async (walletAddress) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const res = await fetch(`/api/user?wallet=${encodeURIComponent(walletAddress)}`);

            if (!res.ok) {
                throw new Error("Failed to fetch user");
            }

            const data = await res.json();
            set({ user: data, error: null });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch user",
                user: null,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProgress: async (walletAddress) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isProgressLoading) return;

        set({ isProgressLoading: true, progressError: null });

        try {
            const res = await fetch(`/api/progress?wallet=${encodeURIComponent(walletAddress)}`);

            if (!res.ok) {
                throw new Error("Failed to fetch progress");
            }

            const data = await res.json();

            // Calculate level and rank from XP
            const xp = data.xp ?? 0;
            const level = Math.floor(xp / 1000);

            // Rank calculation
            let rank = "Newbie";
            if (xp >= 10000) rank = "Expert";
            else if (xp >= 5000) rank = "Advanced";
            else if (xp >= 2500) rank = "Intermediate";
            else if (xp >= 1000) rank = "Squire";

            set({
                progress: {
                    xp,
                    level,
                    rank,
                    currentStreak: data.currentStreak ?? 0,
                    longestStreak: data.longestStreak ?? 0,
                    lastActivityDate: data.lastActivityDate ?? null,
                },
                progressError: null,
            });
        } catch (error) {
            set({
                progressError: error instanceof Error ? error.message : "Failed to fetch progress",
            });
        } finally {
            set({ isProgressLoading: false });
        }
    },

    updateXpOptimistic: (xpGain) => {
        const state = get();
        if (!state.progress) return;

        const newXp = state.progress.xp + xpGain;
        const newLevel = Math.floor(newXp / 1000);

        let newRank = "Newbie";
        if (newXp >= 10000) newRank = "Expert";
        else if (newXp >= 5000) newRank = "Advanced";
        else if (newXp >= 2500) newRank = "Intermediate";
        else if (newXp >= 1000) newRank = "Squire";

        set({
            progress: {
                ...state.progress,
                xp: newXp,
                level: newLevel,
                rank: newRank,
            },
        });
    },

    reset: () => set(initialState),
}));
