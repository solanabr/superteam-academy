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
    isLoading: boolean;
    error: string | null;

    fetchProfile: (wallet: string) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
};

const initialState = {
    profiles: {},
    isLoading: false,
    error: null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
    ...initialState,

    setLoading: (isLoading) => set({ isLoading }),

    fetchProfile: async (wallet) => {
        const state = get();

        // If we already have the profile, we're good (or we can background refresh)
        if (state.profiles[wallet]) return;

        set({ isLoading: true, error: null });

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
            set({
                error: error instanceof Error ? error.message : "Failed to fetch profile",
            });
        } finally {
            set({ isLoading: false });
        }
    },

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
