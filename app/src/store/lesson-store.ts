import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withFallbackRPC } from "@/lib/solana-connection";
import { sendGAEvent } from "@/components/analytics/ThirdPartyScripts";
import { learningProgressService } from "@/lib/learning-progress/service";
import { OnChainLearningService } from "@/lib/learning-progress/onchain-impl";
import { HELIUS_RPC } from "@/lib/solana-connection";

const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";

export type LessonCompletion = {
    courseId: string;
    lessonFlags: number[]; // Bitmap of completed lessons (bytes)
};

export type RunStatus = "idle" | "running" | "passed" | "failed";

export type TestResult = {
    name: string;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
};

type LessonState = {
    completions: Record<string, LessonCompletion>;
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;

    fetchCompletionStatus: (walletAddress: string, courseId: string) => Promise<void>;
    markComplete: (walletAddress: string, courseId: string, lessonIndex: number) => Promise<void>;
    enroll: (walletAddress: string, courseId: string, signTx?: (input: { transaction: Uint8Array; wallet: any; chain?: string; options?: { uiOptions?: any } }) => Promise<{ signedTransaction: Uint8Array }>, wallet?: any, uiOptions?: any) => Promise<void>;

    setCompletionOptimistic: (courseId: string, lessonIndex: number, completed: boolean) => void;
    isLessonCompleted: (courseId: string, lessonIndex: number) => boolean;
    setLoading: (courseId: string, loading: boolean) => void;
    setError: (courseId: string, error: string | null) => void;
    reset: () => void;

    // IDE State
    code: string;
    status: RunStatus;
    message: string | null;
    marking: boolean;
    output: string;
    testResults: TestResult[];
    dailyLimitReached: boolean;
    executionStats: {
        memory?: string;
        cpuTime?: string;
    };
    setCode: (code: string) => void;
    setStatus: (status: RunStatus) => void;
    setMessage: (message: string | null) => void;
    setMarking: (marking: boolean) => void;
    setOutput: (output: string) => void;
    setTestResults: (results: TestResult[]) => void;
    setDailyLimitReached: (reached: boolean) => void;
    setExecutionStats: (stats: { memory?: string; cpuTime?: string }) => void;
    resetExecution: () => void;
};

const initialState = {
    completions: {},
    loading: {},
    errors: {},
    // IDE State initial
    code: "",
    status: "idle" as RunStatus,
    message: null,
    marking: false,
    output: "",
    testResults: [],
    dailyLimitReached: false,
    executionStats: {},
};

export const useLessonStore = create<LessonState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setLoading: (courseId, loading) => {
                set((state) => ({ loading: { ...state.loading, [courseId]: loading } }));
            },

            setError: (courseId, error) => {
                set((state) => ({ errors: { ...state.errors, [courseId]: error } }));
            },

            fetchCompletionStatus: async (walletAddress, courseId) => {
                const state = get();
                if (state.loading[courseId]) return;

                state.setLoading(courseId, true);
                state.setError(courseId, null);

                try {
                    if (USE_ONCHAIN) {
                        await withFallbackRPC(async (connection) => {
                            const service = new OnChainLearningService(connection);
                            const enrollment = await service.getEnrollmentProgress(walletAddress, courseId);

                            if (enrollment) {
                                const flags = Array.from(enrollment.lessonFlags as unknown as Buffer || []);
                                set((state) => ({
                                    completions: {
                                        ...state.completions,
                                        [courseId]: { courseId, lessonFlags: flags }
                                    },
                                }));
                            } else {
                                set((state) => ({
                                    completions: {
                                        ...state.completions,
                                        [courseId]: { courseId, lessonFlags: [] }
                                    },
                                }));
                            }
                        });
                    } else {
                        const res = await fetch(
                            `/api/enrollment?wallet=${encodeURIComponent(walletAddress)}&courseId=${encodeURIComponent(courseId)}`
                        );

                        if (res.ok) {
                            const data = await res.json();
                            if (data && Array.isArray(data.lessonFlags)) {
                                set((state) => ({
                                    completions: {
                                        ...state.completions,
                                        [courseId]: { courseId, lessonFlags: data.lessonFlags },
                                    },
                                }));
                            }
                        } else if (res.status === 404) {
                            set((state) => ({ completions: { ...state.completions, [courseId]: { courseId, lessonFlags: [] } } }));
                        }
                    }
                } catch (error) {
                    if (error instanceof Error && error.name !== 'AbortError') {
                        state.setError(courseId, error.message || "Failed to fetch status");
                    }
                } finally {
                    state.setLoading(courseId, false);
                }
            },

            markComplete: async (walletAddress, courseId, lessonIndex) => {
                const state = get();
                state.setLoading(courseId, true);

                try {
                    if (USE_ONCHAIN) {
                        const res = await fetch("/api/onchain/complete-lesson", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ wallet: walletAddress, courseId, lessonIndex }),
                        });
                        if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.error || "Failed to complete lesson on-chain");
                        }
                    } else {
                        const res = await fetch("/api/complete-lesson", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ wallet: walletAddress, courseId, lessonIndex }),
                        });
                        if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data?.error ?? "Failed to mark lesson complete");
                        }
                    }

                    // Immediately flip the UI (optimistic) — the API already confirmed success
                    get().setCompletionOptimistic(courseId, lessonIndex, true);
                    sendGAEvent('complete_lesson', { course_id: courseId, lesson_index: lessonIndex, xp_earned: 100 });

                    // Sync user progress in the background (fire-and-forget)
                    import("@/store/user-store").then(({ useUserStore }) => {
                        useUserStore.getState().updateXpOptimistic(100);
                        useUserStore.getState().fetchProgress(walletAddress);
                    });
                } catch (error) {
                    state.setError(courseId, error instanceof Error ? error.message : "Failed to complete");
                    throw error;
                } finally {
                    get().setLoading(courseId, false);
                }
            },

            enroll: async (walletAddress, courseId, signTx, wallet, uiOptions) => {
                const state = get();
                state.setLoading(courseId, true);
                state.setError(courseId, null);

                try {
                    if (USE_ONCHAIN) {
                        await withFallbackRPC(async (connection) => {
                            const service = new OnChainLearningService(connection);

                            const tx = await service.enroll(walletAddress, courseId);

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
                                throw new Error("Wallet does not support signing or sending transactions.");
                            }

                            await connection.confirmTransaction(signature, "confirmed");
                            await state.fetchCompletionStatus(walletAddress, courseId);
                        });
                    } else {
                        // Stub enrollment usually happens automatically or via legacy API
                        // For now, do nothing or call an API if exists
                        await state.fetchCompletionStatus(walletAddress, courseId);
                    }
                } catch (error) {
                    state.setError(courseId, error instanceof Error ? error.message : "Enrollment failed");
                    throw error;
                } finally {
                    state.setLoading(courseId, false);
                }
            },

            isLessonCompleted: (courseId, lessonIndex) => {
                const state = get();
                const completion = state.completions[courseId];
                if (!completion || !Array.isArray(completion.lessonFlags)) return false;

                const byteIdx = Math.floor(lessonIndex / 8);
                const bitIdx = lessonIndex % 8;
                if (byteIdx >= completion.lessonFlags.length) return false;

                const byte = completion.lessonFlags[byteIdx];
                return (byte & (1 << bitIdx)) !== 0;
            },

            setCompletionOptimistic: (courseId, lessonIndex, completed) => {
                set((state) => {
                    const current = state.completions[courseId];
                    const byteIdx = Math.floor(lessonIndex / 8);
                    const bitIdx = lessonIndex % 8;

                    // Clone flags
                    let lessonFlags = current ? [...current.lessonFlags] : [];
                    while (lessonFlags.length <= byteIdx) lessonFlags.push(0);

                    if (completed) {
                        lessonFlags[byteIdx] |= 1 << bitIdx;
                    } else {
                        lessonFlags[byteIdx] &= ~(1 << bitIdx);
                    }

                    return {
                        completions: {
                            ...state.completions,
                            [courseId]: { courseId, lessonFlags },
                        },
                    };
                });
            },

            // IDE Actions
            setCode: (code) => set({ code }),
            setStatus: (status) => set({ status }),
            setMessage: (message) => set({ message }),
            setMarking: (marking) => set({ marking }),
            setOutput: (output) => set({ output }),
            setTestResults: (testResults) => set({ testResults }),
            setDailyLimitReached: (dailyLimitReached) => set({ dailyLimitReached }),
            setExecutionStats: (executionStats) => set({ executionStats }),
            resetExecution: () => set({
                status: "idle",
                message: null,
                output: "",
                testResults: [],
                dailyLimitReached: false,
                executionStats: {}
            }),

            reset: () => set(initialState),
        }),
        {
            name: "superteam-lesson-store",
            partialize: (state) => ({ completions: state.completions }), // Only persist course completion bitmasks
        }
    )
);
