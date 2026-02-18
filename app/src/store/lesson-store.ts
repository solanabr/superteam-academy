import { create } from "zustand";

export type LessonCompletion = {
    courseId: string;
    lessonFlags: number[]; // Bitmap of completed lessons
};

type LessonState = {
    // Map of courseId -> lesson completion data
    completions: Record<string, LessonCompletion>;

    // Loading states per course
    loading: Record<string, boolean>;

    // Error states per course
    errors: Record<string, string | null>;

    // Actions
    fetchCompletionStatus: (walletAddress: string, courseId: string) => Promise<void>;
    markComplete: (walletAddress: string, courseId: string, lessonIndex: number) => Promise<void>;
    setCompletionOptimistic: (courseId: string, lessonIndex: number, completed: boolean) => void;
    isLessonCompleted: (courseId: string, lessonIndex: number) => boolean;
    setLoading: (courseId: string, loading: boolean) => void;
    setError: (courseId: string, error: string | null) => void;
    reset: () => void;
};

const initialState = {
    completions: {},
    loading: {},
    errors: {},
};

export const useLessonStore = create<LessonState>((set, get) => ({
    ...initialState,

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

    fetchCompletionStatus: async (walletAddress, courseId) => {
        const state = get();

        // Prevent duplicate fetches
        if (state.loading[courseId]) return;

        state.setLoading(courseId, true);
        state.setError(courseId, null);

        try {
            const res = await fetch(
                `/api/enrollment?wallet=${encodeURIComponent(walletAddress)}&courseId=${encodeURIComponent(courseId)}`
            );

            if (res.ok) {
                const data = await res.json();

                if (data && Array.isArray(data.lessonFlags)) {
                    set((state) => ({
                        completions: {
                            ...state.completions,
                            [courseId]: {
                                courseId,
                                lessonFlags: data.lessonFlags,
                            },
                        },
                        errors: { ...state.errors, [courseId]: null },
                    }));
                }
            } else if (res.status === 404) {
                // Not enrolled - clear completion state
                set((state) => {
                    const { [courseId]: _, ...rest } = state.completions;
                    return { completions: rest };
                });
            } else {
                throw new Error("Failed to fetch completion status");
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                state.setError(
                    courseId,
                    error.message || "Failed to fetch completion status"
                );
            }
        } finally {
            state.setLoading(courseId, false);
        }
    },

    markComplete: async (walletAddress, courseId, lessonIndex) => {
        const state = get();

        // Optimistically mark as complete
        state.setCompletionOptimistic(courseId, lessonIndex, true);

        try {
            const res = await fetch("/api/complete-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: walletAddress,
                    courseId,
                    lessonIndex,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error ?? "Failed to mark lesson complete");
            }

            // Refresh to get server state
            await state.fetchCompletionStatus(walletAddress, courseId);
        } catch (error) {
            // Rollback on error
            state.setCompletionOptimistic(courseId, lessonIndex, false);

            state.setError(
                courseId,
                error instanceof Error ? error.message : "Failed to mark lesson complete"
            );
            throw error;
        }
    },

    setCompletionOptimistic: (courseId, lessonIndex, completed) => {
        set((state) => {
            const current = state.completions[courseId];

            if (!current) {
                // Initialize if doesn't exist
                const byteIdx = Math.floor(lessonIndex / 8);
                const bitIdx = lessonIndex % 8;
                const lessonFlags = new Array(byteIdx + 1).fill(0);

                if (completed) {
                    lessonFlags[byteIdx] = 1 << bitIdx;
                }

                return {
                    completions: {
                        ...state.completions,
                        [courseId]: { courseId, lessonFlags },
                    },
                };
            }

            // Update existing
            const byteIdx = Math.floor(lessonIndex / 8);
            const bitIdx = lessonIndex % 8;
            const lessonFlags = [...current.lessonFlags];

            // Ensure array is large enough
            while (lessonFlags.length <= byteIdx) {
                lessonFlags.push(0);
            }

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

    isLessonCompleted: (courseId, lessonIndex) => {
        const state = get();
        const completion = state.completions[courseId];

        if (!completion || !Array.isArray(completion.lessonFlags)) {
            return false;
        }

        const byteIdx = Math.floor(lessonIndex / 8);
        const bitIdx = lessonIndex % 8;

        if (byteIdx >= completion.lessonFlags.length) {
            return false;
        }

        const byte = completion.lessonFlags[byteIdx];
        return (byte & (1 << bitIdx)) !== 0;
    },

    reset: () => set(initialState),
}));
