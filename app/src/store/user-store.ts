import { create } from "zustand";
import { getLevelFromXp } from "@/lib/ranks";

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
    preferences?: any;
    createdAt: string;
};

export type Credential = {
    id: string;
    courseId?: string | null;
    courseName?: string | null;
    trackId?: string;
    trackName: string;
    mintAddress?: string | null;
    level: number;
    coursesCompleted: number;
    totalXpEarned: number;
    earnedAt: string;
    image?: string;
};

export type UserProgress = {
    xp: number;
    level: number;
    rank: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
};

export type Activity = {
    id: string;
    title: string;
    description: string;
    xp: number;
    timestamp: string;
};

export type UserState = {
    // User data
    user: AppUser | null;
    progress: UserProgress | null;
    credentials: Credential[];
    recentActivities: Activity[]; // CACHED ACTIVITY FEED

    // Loading states
    isLoading: boolean;
    syncComplete: boolean;
    isProgressLoading: boolean;
    isCredentialsLoading: boolean;
    hasMoreCredentials: boolean;
    credentialPage: number;
    isActivitiesLoading: boolean;

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
    setSyncComplete: (complete: boolean) => void;

    fetchUser: (walletAddress: string, background?: boolean) => Promise<void>;
    fetchProgress: (walletAddress: string) => Promise<void>;
    fetchCredentials: (walletAddress: string, page?: number, append?: boolean) => Promise<void>;
    fetchActivities: (walletAddress: string, forceRefresh?: boolean) => Promise<void>;
    updateXpOptimistic: (xpGain: number) => void;
    setProgressDirect: (data: { xp: number; currentStreak: number; longestStreak: number; lastActivityDate: string | Date | null }) => void;

    // Reset store
    reset: () => void;
};

const initialState = {
    user: null,
    progress: null,
    credentials: [],
    recentActivities: [],
    isLoading: false,
    syncComplete: false,
    isProgressLoading: false,
    isCredentialsLoading: false,
    hasMoreCredentials: true,
    credentialPage: 1,
    isActivitiesLoading: false,
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

    setSyncComplete: (syncComplete) => set({ syncComplete }),

    fetchUser: async (walletAddress, background = false) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isLoading && !background) return;

        if (!background) {
            set({ isLoading: true, error: null });
        }

        try {
            const res = await fetch(`/api/user?wallet=${encodeURIComponent(walletAddress)}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
            });

            if (res.status === 404) {
                // User doesn't exist yet, SyncUserOnLogin will handle creation
                // Prevent late-arriving 404s from wiping out a successfully synced user
                if (!get().user) {
                    set({ user: null, error: null });
                }
                return;
            }

            if (!res.ok) {
                throw new Error("Failed to fetch user");
            }

            const data = await res.json();
            set({ user: data, error: null });
        } catch (error) {
            // Prevent late-arriving network errors from wiping out a successfully synced user
            if (!get().user) {
                set({
                    error: error instanceof Error ? error.message : "Failed to fetch user",
                    user: null,
                });
            }
        } finally {
            if (!background) {
                set({ isLoading: false });
            }
        }
    },

    fetchProgress: async (walletAddress) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.isProgressLoading) return;

        set({ isProgressLoading: true, progressError: null });

        try {
            const res = await fetch(`/api/progress?wallet=${encodeURIComponent(walletAddress)}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch progress");
            }

            const data = await res.json();

            // Calculate level and rank from XP
            const xp = data.xp ?? 0;
            const level = getLevelFromXp(xp);

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

    fetchCredentials: async (walletAddress, page = 1, append = false) => {
        const state = get();
        const limit = 5;

        // Smart Cache: If we already have enough credentials for this page, and it's not a refresh, skip.
        // For page 1: if credentials.length >= limit and not appending, we might already have it.
        // For append: if credentials.length >= page * limit, we already have this page.
        if (state.credentials.length >= page * limit && !state.isLoading) {
            return;
        }

        if (state.isCredentialsLoading) return;

        set({ isCredentialsLoading: true, credentialPage: page });

        try {
            const limit = 5;
            const res = await fetch(`/api/credentials?wallet=${encodeURIComponent(walletAddress)}&page=${page}&limit=${limit}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
            });
            if (!res.ok) throw new Error("Failed to fetch credentials");

            const data = await res.json();
            const newCredentials = data.credentials || [];

            set({
                credentials: append ? [...state.credentials, ...newCredentials] : newCredentials,
                hasMoreCredentials: data.pagination?.hasMore ?? (newCredentials.length === limit)
            });
        } catch (error) {
            console.error("fetchCredentials error:", error);
        } finally {
            set({ isCredentialsLoading: false });
        }
    },

    fetchActivities: async (walletAddress: string, forceRefresh = false) => {
        const state = get();
        if (state.isActivitiesLoading) return;

        set({ isActivitiesLoading: true });

        try {
            const res = await fetch(`/api/activities?wallet=${encodeURIComponent(walletAddress)}&limit=10`);
            if (!res.ok) throw new Error("Failed to fetch activities");

            const data = await res.json();
            set({ recentActivities: data.activities || [] });
        } catch (error) {
            console.error("fetchActivities error:", error);
        } finally {
            set({ isActivitiesLoading: false });
        }
    },

    updateXpOptimistic: (xpGain) => {
        const state = get();
        if (!state.progress || !state.user) return;

        const newXp = state.progress.xp + xpGain;
        const newLevel = getLevelFromXp(newXp);

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

        // Sync with Profile Store if it has the current user loaded
        import("@/store/profile-store").then(({ useProfileStore }) => {
            useProfileStore.getState().updateProfileXp(state.user!.walletAddress, xpGain);
        });
    },

    setProgressDirect: (data) => {
        const xp = data.xp ?? 0;
        const level = getLevelFromXp(xp);

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
                lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate as any).toISOString() : null,
            },
            isProgressLoading: false,
        });
    },

    reset: () => set(initialState),
}));
