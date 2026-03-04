import { create } from "zustand";

/**
 * useCourseStore - Unified state for the Course Detail page.
 * Handles enrollment lifecycle, graduation status, and UI transitions.
 */

interface CourseState {
    // Course completion status (lessons complete / total)
    progress: {
        courseId: string;
        completedCount: number;
        totalLessons: number;
        completedAt: string | null;
        mintAddress?: string | null;
        credentialId?: string | null;
        onChainActive?: boolean;
        bonusClaimed?: boolean;
    } | null;

    // UI Status
    isEnrolling: boolean;
    isGraduating: boolean;
    isClaimingBonus: boolean;
    isLoading: boolean;
    error: string | null;

    // Transaction Feedback
    txSuccess: boolean;
    txError: string | null;

    // Optimistic flags to hold UI state after mutation
    lastMutation: 'enroll' | 'graduate' | 'unenroll' | null;
    mutationTimestamp: number;

    // Actions
    fetchProgress: (wallet: string, courseId: string, silent?: boolean, force?: boolean) => Promise<void>;
    enroll: (wallet: string, courseId: string, signTx?: any, walletAdapter?: any, uiOptions?: any) => Promise<void>;
    unenroll: (wallet: string, courseId: string, signTx?: any, walletAdapter?: any, uiOptions?: any) => Promise<void>;
    reclaimRent: (wallet: string, courseId: string, signTx?: any, walletAdapter?: any, uiOptions?: any) => Promise<void>;
    graduate: (wallet: string, courseId: string, lessonCount: number) => Promise<void>;
    setProgress: (progress: any) => void;
    clearTxFeedback: () => void;
    reset: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
    progress: null,
    isEnrolling: false,
    isGraduating: false,
    isClaimingBonus: false,
    isLoading: false,
    error: null,

    txSuccess: false,
    txError: null,

    lastMutation: null,
    mutationTimestamp: 0,

    setProgress: (progress) => set({ progress }),

    clearTxFeedback: () => set({ txSuccess: false, txError: null }),

    fetchProgress: async (wallet, courseId, silent = false, force = false) => {
        // Only fetch if NOT currently muting (to prevent race conditions)
        const state = get();
        if (state.isEnrolling || (state.isGraduating && !force)) return;

        if (!silent) set({ isLoading: true, error: null });
        try {
            const query = new URLSearchParams({
                wallet: wallet,
                courseId: courseId,
            });
            if (force) query.set("poll", "true");

            const res = await fetch(`/api/enrollment?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();

                // Advanced Optimistic Guard:
                // If we recently performed a mutation, and the server hasn't seen it yet (data is stale),
                // we preserve our local optimistic state to prevent flickers.
                const now = Date.now();
                const isRecentEnroll = state.lastMutation === 'enroll' && (now - state.mutationTimestamp < 5000);
                const isRecentGraduate = state.lastMutation === 'graduate' && (now - state.mutationTimestamp < 5000);

                if (isRecentEnroll && !data) {
                    console.log("[course-store] Preserving optimistic enrollment state...");
                    return;
                }

                if (isRecentGraduate && data && !data.completedAt) {
                    console.log("[course-store] Preserving optimistic graduation state...");
                    // Merge local completion into stale server data
                    set({
                        progress: { ...data, completedAt: new Date(state.mutationTimestamp).toISOString() },
                        isLoading: false
                    });
                    return;
                }

                set({ progress: data, isLoading: false });
            } else if (res.status === 404) {
                // Only clear if we didn't just enroll
                if (state.lastMutation !== 'enroll' || (Date.now() - state.mutationTimestamp > 5000)) {
                    set({ progress: null, isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } else {
                set({ isLoading: false });
            }
        } catch (e: any) {
            if (!silent) set({ error: e.message, isLoading: false });
        }
    },

    enroll: async (wallet, courseId, signTx, walletAdapter, uiOptions) => {
        set({ isEnrolling: true, error: null, txSuccess: false, txError: null, lastMutation: 'enroll', mutationTimestamp: Date.now() });

        try {
            const { useEnrollmentStore } = await import("./enrollment-store");
            await useEnrollmentStore.getState().enroll(wallet, courseId, signTx, walletAdapter, uiOptions);

            set({ txSuccess: true, isEnrolling: false });

            // Single delayed fetch to sync server state — no aggressive polling needed
            // The enrollment-store already set optimistic state and fires background syncs
            setTimeout(() => {
                get().fetchProgress(wallet, courseId, true, true);
            }, 3000);

        } catch (e: any) {
            set({ txError: e.message, isEnrolling: false, progress: null, lastMutation: null });
            throw e;
        }
    },

    unenroll: async (wallet, courseId, signTx, walletAdapter, uiOptions) => {
        set({ isLoading: true, error: null, txSuccess: false, txError: null, lastMutation: 'unenroll', mutationTimestamp: Date.now() });
        try {
            const { useEnrollmentStore } = await import("./enrollment-store");
            await useEnrollmentStore.getState().unenroll(wallet, courseId, signTx, walletAdapter, uiOptions);
            set({ progress: null, isLoading: false, txSuccess: true });
        } catch (e: any) {
            set({ txError: e.message, isLoading: false });
            throw e;
        }
    },

    reclaimRent: async (wallet, courseId, signTx, walletAdapter, uiOptions) => {
        set({ isLoading: true, error: null, txSuccess: false, txError: null, lastMutation: 'unenroll', mutationTimestamp: Date.now() });
        try {
            const { useEnrollmentStore } = await import("./enrollment-store");
            await useEnrollmentStore.getState().reclaimRent(wallet, courseId, signTx, walletAdapter, uiOptions);

            // Reclaiming rent closes the on-chain account but keeps the DB history for Course Completed tags.
            const currentProgress = get().progress;
            if (currentProgress) {
                set({ txSuccess: true, isLoading: false, progress: { ...currentProgress, onChainActive: false } });
            } else {
                set({ txSuccess: true, isLoading: false });
            }
        } catch (e: any) {
            set({ txError: e.message, isLoading: false });
            throw e;
        }
    },

    graduate: async (wallet, courseId, lessonCount) => {
        set({ isGraduating: true, error: null, txSuccess: false, txError: null, lastMutation: 'graduate', mutationTimestamp: Date.now() });
        try {
            const { useEnrollmentStore } = await import("./enrollment-store");
            await useEnrollmentStore.getState().finalize(wallet, courseId, lessonCount);

            set({ txSuccess: true });

            // Update local progress state instantly
            const current = get().progress;
            if (current) {
                set({
                    progress: { ...current, completedAt: new Date().toISOString() }
                });
            }

            // Refresh specifically with forcing (bypass cache) before clearing isGraduating
            await get().fetchProgress(wallet, courseId, true, true);
            set({ isGraduating: false });
        } catch (e: any) {
            set({ txError: e.message, isGraduating: false });
            throw e;
        }
    },

    reset: () => set({
        progress: null,
        isEnrolling: false,
        isGraduating: false,
        isLoading: false,
        error: null,
        txSuccess: false,
        txError: null,
        lastMutation: null
    })
}));
