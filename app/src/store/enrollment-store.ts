import { create } from "zustand";
import { withFallbackRPC } from "@/lib/solana-connection";
import { sendGAEvent } from "@/components/analytics/ThirdPartyScripts";

export type EnrollmentProgress = {
  courseId: string;
  completedCount: number;
  totalLessons: number;
  completedAt: string | null;
  bonusClaimed: boolean;
  onChainActive?: boolean;
  mintAddress?: string | null;
  credentialId?: string | null;
};

export type AllEnrollmentItem = {
  courseId: string;
  title: string;
  slug: string;
  track: string | null;
  difficulty: string | null;
  duration: string | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  completedAt: string | null;
  bonusClaimed: boolean;
  updatedAt: string;
};

type EnrollmentState = {
  // Map of courseId -> enrollment progress
  enrollments: Record<string, EnrollmentProgress>;
  // All enrollments list (for dashboard / course progress overlays)
  allEnrollments: AllEnrollmentItem[];
  isLoadingAll: boolean;
  // Map of courseId -> loading state
  loading: Record<string, boolean>;
  // Map of courseId -> error message
  errors: Record<string, string | null>;
  // Actions
  fetchEnrollment: (walletAddress: string, courseId: string, force?: boolean) => Promise<void>;
  fetchAllEnrollments: (walletAddress: string, force?: boolean) => Promise<void>;
  enroll: (walletAddress: string, courseId: string, signTx?: (input: { transaction: Uint8Array; wallet: any; chain?: string; options?: { uiOptions?: any } }) => Promise<{ signedTransaction: Uint8Array }>, wallet?: any, uiOptions?: any) => Promise<void>;
  unenroll: (walletAddress: string, courseId: string, signTx?: (input: { transaction: Uint8Array; wallet: any; chain?: string; options?: { uiOptions?: any } }) => Promise<{ signedTransaction: Uint8Array }>, wallet?: any, uiOptions?: any) => Promise<void>;
  finalize: (walletAddress: string, courseId: string, lessonCount: number) => Promise<void>;
  claimBonus: (walletAddress: string, courseId: string, xpAmount: number) => Promise<void>;
  reclaimRent: (walletAddress: string, courseId: string, signTx?: (input: { transaction: Uint8Array; wallet: any; chain?: string; options?: { uiOptions?: any } }) => Promise<{ signedTransaction: Uint8Array }>, wallet?: any, uiOptions?: any) => Promise<void>;
  setEnrollment: (courseId: string, progress: EnrollmentProgress | null) => void;
  setLoading: (courseId: string, loading: boolean) => void;
  setError: (courseId: string, error: string | null) => void;
  // Transaction Preparation
  prepareEnrollment: (walletAddress: string, courseId: string) => Promise<any>;
  prepareCloseEnrollment: (walletAddress: string, courseId: string) => Promise<any>;
  // Optimistic update helpers
  setEnrollmentOptimistic: (courseId: string, totalLessons: number) => void;
  setBonusClaimedOptimistic: (courseId: string, claimed: boolean) => void;
  // Reset
  reset: () => void;
};

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: {},
  allEnrollments: [],
  isLoadingAll: false,
  loading: {},
  errors: {},

  setEnrollment: (courseId, progress) => {
    set((state) => ({
      enrollments: { ...state.enrollments, [courseId]: progress as any },
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
        // Also update allEnrollments entry if it exists, to keep progress in sync
        set((s) => ({
          allEnrollments: s.allEnrollments.map((e) =>
            e.courseId === courseId
              ? { ...e, completedLessons: data.completedCount ?? e.completedLessons, totalLessons: data.totalLessons ?? e.totalLessons, progressPercent: data.totalLessons > 0 ? Math.round(((data.completedCount ?? 0) / data.totalLessons) * 100) : 0, completedAt: data.completedAt }
              : e
          ),
        }));
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

  fetchAllEnrollments: async (walletAddress, force = false) => {
    const state = get();
    // Skip if already loading or data exists and not forced
    if (state.isLoadingAll) return;
    if (!force && state.allEnrollments.length > 0) return;

    set({ isLoadingAll: true });
    try {
      const res = await fetch(
        `/api/enrollment/list?wallet=${encodeURIComponent(walletAddress)}`
      );
      if (res.ok) {
        const data: AllEnrollmentItem[] = await res.json();
        set({ allEnrollments: data });
      }
    } catch (error) {
      console.error("fetchAllEnrollments error:", error);
    } finally {
      set({ isLoadingAll: false });
    }
  },

  enroll: async (walletAddress, courseId, signTx, wallet, uiOptions) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      if (!wallet) {
        throw new Error("No wallet connected. Please connect your Solana wallet.");
      }

      let signature: string = "";
      await withFallbackRPC(async (connection) => {
        const { PublicKey, SystemProgram } = await import("@solana/web3.js");
        const { Program } = await import("@coral-xyz/anchor");
        // @ts-ignore
        const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

        const pubkey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(pubkey);
        if (balance < 0.003 * 1_000_000_000) {
          throw new Error("Insufficient Devnet SOL for enrollment rent. Please claim your Airdrop in Settings.");
        }

        console.log("Processing User-Paid enrollment via signTransaction...");
        const program = new Program(onchainAcademyIdl as any, { connection } as any);
        const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
        const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), pubkey.toBuffer()], program.programId);

        const tx = await program.methods
          .enroll(courseId)
          .accounts({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: pubkey,
            systemProgram: SystemProgram.programId,
          } as any)
          .transaction();

        tx.feePayer = pubkey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        if (signTx && wallet) {
          // Serialize and sign via Privy
          const serializedTx = tx.serialize({ verifySignatures: false });
          const { signedTransaction } = await signTx({
            transaction: serializedTx,
            wallet: wallet,
            chain: "solana:devnet",
            options: { uiOptions }
          });

          // 4. Broadcast and Await Confirmation
          signature = await connection.sendRawTransaction(signedTransaction);
        } else if (wallet && typeof wallet.sendTransaction === 'function') {
          // Fallback for direct wallet adapter if available
          signature = await wallet.sendTransaction(tx, connection, { uiOptions });
        } else {
          throw new Error("Wallet does not support signing or sending transactions.");
        }

        console.log("Enrollment TX sent:", signature);
        await connection.confirmTransaction(signature, "confirmed");
        console.log("Enrollment confirmed:", signature);
      });

      // 2. Flip UI to "Enrolled" (Optimistic but backed by confirmation)
      state.setEnrollmentOptimistic(courseId, 0);
      state.setLoading(courseId, false);

      // 3. Atomic Sync: Write to DB, Invalidate Cache, and Fetch Fresh State
      try {
        const res = await fetch("/api/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, courseId, signature }),
        });

        if (res.ok) {
          // Surgical Sync: Refresh courses grid and current detail
          await fetch("/api/sync/course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: walletAddress }),
          }).catch(() => null);

          sendGAEvent('enroll', { course_id: courseId, wallet: walletAddress });

          // Parallel refresh: Current enrollment + All enrollments (for dashboard)
          await Promise.all([
            get().fetchEnrollment(walletAddress, courseId, true),
            get().fetchAllEnrollments(walletAddress, true)
          ]);
        }
      } catch (e) {
        console.error("Enrollment DB sync failed:", e);
      }
    } catch (error) {
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Enrollment failed"
      );
      state.setLoading(courseId, false);
      throw error;
    }
  },

  unenroll: async (walletAddress, courseId, signTx, wallet, uiOptions) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      if (!wallet) {
        throw new Error("No wallet connected. Please connect your Solana wallet.");
      }

      if (process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
        await withFallbackRPC(async (connection) => {
          const { PublicKey } = await import("@solana/web3.js");
          const { Program } = await import("@coral-xyz/anchor");
          // @ts-ignore
          const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

          const program = new Program(onchainAcademyIdl as any, { connection } as any);

          const pubkey = new PublicKey(walletAddress);
          const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
          const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), pubkey.toBuffer()], program.programId);

          const tx = await program.methods
            .closeEnrollment()
            .accounts({
              course: coursePda,
              enrollment: enrollmentPda,
              learner: pubkey,
            } as any)
            .transaction();

          tx.feePayer = pubkey;
          const { blockhash } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;

          let signature: string;
          if (signTx && wallet) {
            const serializedTx = tx.serialize({ verifySignatures: false });
            const { signedTransaction } = await signTx({
              transaction: serializedTx,
              wallet: wallet,
              chain: "solana:devnet",
              options: { uiOptions }
            });
            signature = await connection.sendRawTransaction(signedTransaction);
          } else if (wallet && typeof wallet.sendTransaction === 'function') {
            signature = await wallet.sendTransaction(tx, connection, { uiOptions });
          } else {
            throw new Error("Wallet does not support signing or sending transactions");
          }

          await connection.confirmTransaction(signature, "confirmed");
          console.log("Unenrollment on-chain successful:", signature);
        });
      }

      const res = await fetch("/api/unenroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, courseId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unenrollment failed");
      }

      state.setEnrollment(courseId, null);
    } catch (error) {
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Unenrollment failed"
      );
      throw error;
    } finally {
      state.setLoading(courseId, false);
    }
  },

  finalize: async (walletAddress, courseId, lessonCount) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      const res = await fetch(`/api/graduation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          courseId: courseId,
          lessonCount
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Finalization failed");
      }

      // Clear loading BEFORE fetchEnrollment so its guard doesn't block the refresh
      state.setLoading(courseId, false);

      // Surgical Sync: Course status, Certificates, and XP/Level
      await Promise.all([
        fetch("/api/sync/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        }),
        fetch("/api/sync/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        }),
        fetch("/api/sync/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        })
      ]).catch(() => null);

      sendGAEvent('graduate', { course_id: courseId, wallet: walletAddress, xp_earned: 500 });
      await get().fetchEnrollment(walletAddress, courseId);
      // Also refresh dashboard lists
      await get().fetchAllEnrollments(walletAddress, true);
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

      // Surgical Sync: Refresh XP/Level on dashboard
      await fetch("/api/sync/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      }).catch(() => null);

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

  reclaimRent: async (walletAddress, courseId, signTx, wallet, uiOptions) => {
    const state = get();
    state.setLoading(courseId, true);
    state.setError(courseId, null);

    try {
      if (!wallet) {
        throw new Error("No wallet connected.");
      }

      await withFallbackRPC(async (connection) => {
        const { PublicKey, Transaction } = await import("@solana/web3.js");
        const { Program } = await import("@coral-xyz/anchor");
        // @ts-ignore
        const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

        const program = new Program(onchainAcademyIdl as any, { connection } as any);

        const pubkey = new PublicKey(walletAddress);
        const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
        const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), pubkey.toBuffer()], program.programId);

        const tx = await program.methods
          .closeEnrollment()
          .accounts({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: pubkey,
          } as any)
          .transaction();

        tx.feePayer = pubkey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        let signature: string;
        if (signTx && wallet) {
          const serializedTx = tx.serialize({ verifySignatures: false });
          const { signedTransaction } = await signTx({
            transaction: serializedTx,
            wallet: wallet,
            chain: "solana:devnet",
            options: { uiOptions }
          });
          signature = await connection.sendRawTransaction(signedTransaction);
        } else if (wallet && typeof wallet.sendTransaction === 'function') {
          signature = await wallet.sendTransaction(tx, connection, { uiOptions });
        } else {
          throw new Error("Wallet does not support signing or sending transactions");
        }

        await connection.confirmTransaction(signature, "confirmed");
        console.log("Rent reclaimed successfully:", signature);
      });

      // 1. Surgical Sync - Invalidate specific course/certificate caches
      await Promise.all([
        fetch("/api/sync/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        }),
        fetch("/api/sync/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        })
      ]).catch(e => console.error("Surgical Sync failed:", e));

      // 2. Refresh enrollment status (Now fetches fresh data bypass-cache)
      await state.fetchEnrollment(walletAddress, courseId, true);
      await state.fetchAllEnrollments(walletAddress, true);
    } catch (error) {
      state.setError(
        courseId,
        error instanceof Error ? error.message : "Reclaiming rent failed"
      );
      throw error;
    } finally {
      state.setLoading(courseId, false);
    }
  },

  prepareEnrollment: async (walletAddress, courseId) => {
    return await withFallbackRPC(async (connection) => {
      const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
      const { Program } = await import("@coral-xyz/anchor");
      // @ts-ignore
      const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

      const pubkey = new PublicKey(walletAddress);
      const program = new Program(onchainAcademyIdl as any, { connection } as any);
      const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
      const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), pubkey.toBuffer()], program.programId);

      const tx = await program.methods
        .enroll(courseId)
        .accounts({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: pubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .transaction();

      tx.feePayer = pubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      return tx;
    });
  },

  prepareCloseEnrollment: async (walletAddress, courseId) => {
    return await withFallbackRPC(async (connection) => {
      const { PublicKey, Transaction } = await import("@solana/web3.js");
      const { Program } = await import("@coral-xyz/anchor");
      // @ts-ignore
      const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

      const program = new Program(onchainAcademyIdl as any, { connection } as any);
      const pubkey = new PublicKey(walletAddress);
      const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
      const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), pubkey.toBuffer()], program.programId);

      const tx = await program.methods
        .closeEnrollment()
        .accounts({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: pubkey,
        } as any)
        .transaction();

      tx.feePayer = pubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      return tx;
    });
  },

  reset: () => set({
    enrollments: {},
    allEnrollments: [],
    isLoadingAll: false,
    loading: {},
    errors: {},
  }),
}));
