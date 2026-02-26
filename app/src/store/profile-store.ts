import { create } from "zustand";
import type { Credential } from "./user-store";

export type PublicProfile = {
    user: {
        id: string;
        walletAddress: string;
        createdAt: string;
        profile: any;
    };
    xp: number;
    level: number;
    achievementFlags: number[];
    credentials: Credential[];
};

type ProfileState = {
    profiles: Record<string, PublicProfile>;
    isInitialLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    fetchProfile: (wallet: string) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
};

const initialState = {
    profiles: {},
    isInitialLoading: false,
    isRefreshing: false,
    error: null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
    ...initialState,

    setLoading: (loading) => set({ isInitialLoading: loading }),

    fetchProfile: async (wallet) => {
        const state = get();
        const hasData = !!state.profiles[wallet];

        // If no data, it's an initial load. If data exists, it's a background refresh.
        if (hasData) {
            set({ isRefreshing: true });
        } else {
            set({ isInitialLoading: true, error: null });
        }

        try {
            const res = await fetch(`/api/user/${wallet}`);
            if (!res.ok) throw new Error("User not found");

            const data = await res.json();
            set((s) => ({
                profiles: {
                    ...s.profiles,
                    [wallet]: data
                },
                error: null
            }));
        } catch (error) {
            // Only set error if we don't have any data yet
            if (!hasData) {
                set({
                    error: error instanceof Error ? error.message : "Failed to fetch profile",
                });
            }
        } finally {
            set({ isInitialLoading: false, isRefreshing: false });
        }
    },

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
