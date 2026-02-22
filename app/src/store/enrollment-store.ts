import { create } from "zustand";

export type EnrollmentProgress = {
  courseId: string;
  completedCount: number;
  totalLessons: number;
  completedAt: string | null;
  bonusClaimed: boolean;
};

type EnrollmentState = {
  // Map of courseId -> enrollment progress
  enrollments: Record<string, EnrollmentProgress>;
  // Map of courseId -> loading state
  loading: Record<string, boolean>;
  // Map of courseId -> error message
  errors: Record<string, string | null>;
  // Actions
  fetchEnrollment: (walletAddress: string, courseId: string, force?: boolean) => Promise<void>;
  enroll: (walletAddress: string, courseId: string) => Promise<void>;
  finalize: (walletAddress: string, courseId: string, lessonCount: number) => Promise<void>;
  claimBonus: (walletAddress: string, courseId: string, xpAmount: number) => Promise<void>;
  setEnrollment: (courseId: string, progress: EnrollmentProgress | null) => void;
  setLoading: (courseId: string, loading: boolean) => void;
  setError: (courseId: string, error: string | null) => void;
  // Optimistic update helpers
  setEnrollmentOptimistic: (courseId: string, totalLessons: number) => void;
  setBonusClaimedOptimistic: (courseId: string, claimed: boolean) => void;
  // Reset
  reset: () => void;
};

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: {},
  loading: {},
  errors: {},

  setEnrollment: (courseId, progress) => {
    set((state) => ({
      enrollments: progress
        ? { ...state.enrollments, [courseId]: progress }
        : (() => {
          const { [courseId]: _, ...rest } = state.enrollments;
          return rest;
        })(),
      errors: { ...state.errors, [courseId]: null },
    }));
  },

  setLoading: (courseId, loading) => {
    set((state) => ({
      loading: { ...state.loading, [courseId]: loading },
    }));
  },

  setError: (courseId, error) => {
    set((state) => ({
      errors: { ...state.errors, [courseId]: error },
    }));
  },

  setEnrollmentOptimistic: (courseId, totalLessons) => {
    // Optimistically set enrollment before API call completes
    set((state) => ({
      enrollments: {
        ...state.enrollments,
        [courseId]: {
          courseId,
          completedCount: 0,
          totalLessons,
          completedAt: null,
          bonusClaimed: false,
        },
      },
      errors: { ...state.errors, [courseId]: null },
    }));
  },

  setBonusClaimedOptimistic: (courseId, claimed) => {
    set((state) => {
      const current = state.enrollments[courseId];
      if (!current) return state;

      return {
        enrollments: {
          ...state.enrollments,
          [courseId]: {
            ...current,
            bonusClaimed: claimed,
          },
        },
      };
    });
  },

  fetchEnrollment: async (walletAddress, courseId, force = false) => {
    const state = get();
    // Prevent duplicate fetches unless forced (like during retries)
    if (!force && state.loading[courseId]) return;

    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      const res = await fetch(
        `/api/enrollment?wallet=${encodeURIComponent(walletAddress)}&courseId=${encodeURIComponent(courseId)}`
      );

      if (res.ok) {
        const data = await res.json();
        // Ensure bonusClaimed is present (backward compatibility)
        if (data && typeof data.bonusClaimed === 'undefined') {
          data.bonusClaimed = false;
        }
        state.setEnrollment(courseId, data);
      } else if (res.status === 404) {
        // Not enrolled - clear enrollment state
        state.setEnrollment(courseId, null);
      } else {
        throw new Error("Failed to fetch enrollment");
      }
    } catch (error) {
      // Ignore abort errors (component unmounted/navigated away)
      if (error instanceof Error && error.name !== 'AbortError') {
        state.setError(
          courseId,
          error.message || "Failed to fetch enrollment"
        );
      }
      // Don't clear enrollment on error - keep existing state
    } finally {
      state.setLoading(courseId, false);
    }
  },

  enroll: async (walletAddress, courseId) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      // Check Devnet SOL balance before allowing enrollment
      const { Connection, PublicKey } = await import("@solana/web3.js");
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com");
      const pubkey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubkey);

      // Require at least 0.01 SOL (10,000,000 lamports) for gas
      if (balance < 0.01 * 1_000_000_000) {
        throw new Error("Insufficient Devnet SOL for gas. Please claim your Airdrop in Settings.");
      }

      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, courseId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Enrollment failed");
      }

      // Assume enrollment succeeded instantly for snappy UI
      state.setEnrollmentOptimistic(courseId, 0);

      // Fetch actual enrollment data from server with backoff for RPC sync delays
      // Run this asynchronously to not block the UI
      (async () => {
        let retries = 5;
        while (retries > 0) {
          try {
            const pollRes = await fetch(
              `/api/enrollment?wallet=${encodeURIComponent(walletAddress)}&courseId=${encodeURIComponent(courseId)}`
            );

            if (pollRes.ok) {
              const data = await pollRes.json();
              if (data && typeof data.bonusClaimed === 'undefined') {
                data.bonusClaimed = false;
              }
              // Successfully found on-chain data, finalize our optimistic UI with the real data
              get().setEnrollment(courseId, data);
              break;
            }
          } catch (e) {
            // Ignore network errors during polling
          }

          await new Promise((r) => setTimeout(r, 2000));
          retries--;
        }
        state.setLoading(courseId, false);
      })();
    } catch (error) {
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Enrollment failed"
      );
      state.setLoading(courseId, false);
      throw error;
    }
  },

  finalize: async (walletAddress, courseId, lessonCount) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      const res = await fetch(`/api/courses/${courseId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, lessonCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Finalization failed");
      }

      // Clear loading BEFORE fetchEnrollment so its guard doesn't block the refresh
      state.setLoading(courseId, false);
      await get().fetchEnrollment(walletAddress, courseId);
    } catch (error) {
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Finalization failed"
      );
      state.setLoading(courseId, false);
      throw error;
    }
  },

  claimBonus: async (walletAddress, courseId, xpAmount) => {
    const state = get();

    // Optimistically set bonusClaimed to true immediately
    state.setBonusClaimedOptimistic(courseId, true);
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      const res = await fetch(`/api/courses/${courseId}/claim-bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, xpAmount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Claim failed");
      }

      // Clear loading BEFORE fetchEnrollment so its guard doesn't block the refresh
      state.setLoading(courseId, false);
      await get().fetchEnrollment(walletAddress, courseId);
    } catch (error) {
      // Rollback optimistic update on error
      state.setBonusClaimedOptimistic(courseId, false);
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Claim failed"
      );
      state.setLoading(courseId, false);
      throw error;
    }
  },

  reset: () => set({
    enrollments: {},
    loading: {},
    errors: {},
  }),
}));
