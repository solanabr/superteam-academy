import { create } from "zustand";

export type Achievement = {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    claimed: boolean;
    claimedAt?: string;
};

type AchievementState = {
    // List of achievements
    achievements: Achievement[];

    // Loading states
    isLoading: boolean;
    claimingId: string | null;

    // Error state
    error: string | null;

    // Actions
    fetchAchievements: (walletAddress: string) => Promise<void>;
    claimAchievement: (walletAddress: string, achievementId: string) => Promise<boolean>;
    setClaimOptimistic: (achievementId: string, claimed: boolean) => void;
    setLoading: (loading: boolean) => void;
    setClaimingId: (id: string | null) => void;
    setError: (error: string | null) => void;
    reset: () => void;
};

const initialState = {
    achievements: [],
    isLoading: false,
    claimingId: null,
    error: null,
};

export const useAchievementStore = create<AchievementState>((set, get) => ({
    ...initialState,

    setLoading: (isLoading) => set({ isLoading }),

    setClaimingId: (claimingId) => set({ claimingId }),

    setError: (error) => set({ error }),

    fetchAchievements: async (walletAddress) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const res = await fetch(`/api/achievements?wallet=${encodeURIComponent(walletAddress)}`);

            if (!res.ok) {
                throw new Error("Failed to fetch achievements");
            }

            const data = await res.json();
            set({ achievements: data, error: null });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch achievements",
            });
        } finally {
            set({ isLoading: false });
        }
    },

    claimAchievement: async (walletAddress, achievementId) => {
        const state = get();
        state.setClaimingId(achievementId);

        // PLATINUM: Update local state BEFORE API call for maximum responsiveness
        state.setClaimOptimistic(achievementId, true);

        try {
            const res = await fetch("/api/achievements/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: walletAddress, achievementId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                // PLATINUM: Rollback on failure
                state.setClaimOptimistic(achievementId, false);
                throw new Error(data?.error ?? "Failed to claim achievement");
            }

            const data = await res.json();

            // Optimistically update user XP globally
            import("@/store/user-store").then(({ useUserStore }) => {
                const ACH_XP = data.xpAmount || (achievementId === 'easter-egg' ? 1000 : 200);
                useUserStore.getState().updateXpOptimistic(ACH_XP);
            });

            // Note: We don't fetchAchievements immediately because Inngest background sync
            // is still running. The local "optimistic" state will persist.
            return data.ok === true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to claim achievement",
            });
            throw error;
        } finally {
            state.setClaimingId(null);
        }
    },

    setClaimOptimistic: (achievementId, claimed) => {
        set((state) => ({
            achievements: state.achievements.map((achievement) =>
                achievement.id === achievementId
                    ? { ...achievement, claimed, claimedAt: claimed ? new Date().toISOString() : undefined }
                    : achievement
            ),
        }));
    },

    reset: () => set(initialState),
}));
