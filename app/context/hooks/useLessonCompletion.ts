'use client';

/**
 * React hooks for lesson completion and course progress tracking.
 *
 * Lesson completion is a backend-signed operation:
 * 1. Frontend sends POST /api/lessons/complete
 * 2. Backend validates, signs, and submits the transaction
 * 3. Frontend updates UI with new progress
 *
 * Progress is tracked via the on-chain enrollment bitmap.
 *
 * In mock mode, progress is tracked locally in memory (no wallet/on-chain).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { goeyToast } from 'goey-toast';
import {
    fetchEnrollment,
    type EnrollmentState,
} from '@/context/solana/enrollment-service';
import {
    countCompletedLessons,
    getProgressPercentage,
    isLessonComplete,
    isCourseFullyCompleted,
    getCompletedLessonIndices,
} from '@/context/solana/bitmap';

const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ─── Mock Mode: in-memory completion tracking ─────────────────────────
const mockCompletedLessons = new Map<string, Set<number>>();

function getMockCompleted(courseId: string): Set<number> {
    if (!mockCompletedLessons.has(courseId)) {
        mockCompletedLessons.set(courseId, new Set<number>());
    }
    return mockCompletedLessons.get(courseId)!;
}

// ─── Types ───────────────────────────────────────────────────────────

/** Granular step tracking for lesson completion UX */
export type CompletionStep = 'idle' | 'submitting' | 'confirming';

interface LessonCompletionResult {
    success: boolean;
    signature: string;
    slot: number;
}

export interface CourseProgressData {
    enrollment: EnrollmentState | null;
    completedCount: number;
    totalLessons: number;
    progressPercent: number;
    completedIndices: number[];
    isFullyCompleted: boolean;
    isEnrolled: boolean;
}

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Hook for completing a lesson.
 *
 * In real mode: sends POST /api/lessons/complete (backend-signed).
 * In mock mode: tracks completion locally and shows celebratory toast.
 */
export function useLessonCompletion(courseId: string) {
    const { publicKey } = useWallet();
    const queryClient = useQueryClient();
    const [completionStep, setCompletionStep] = useState<CompletionStep>('idle');

    // ── Mock mode completion ─────────────────────────────────────
    const mockMutation = useMutation<LessonCompletionResult, Error, number>({
        mutationFn: async (lessonIndex: number) => {
            setCompletionStep('submitting');
            // Simulate a short delay for UX
            await new Promise((r) => setTimeout(r, 600));

            // Track locally
            getMockCompleted(courseId).add(lessonIndex);

            setCompletionStep('confirming');
            await new Promise((r) => setTimeout(r, 300));

            return { success: true, signature: 'mock-sig', slot: 0 };
        },
        onSuccess: () => {
            setCompletionStep('idle');
            goeyToast.success('Lesson Completed! ✨', {
                description: 'XP earned — keep going!',
            });
            queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
            queryClient.invalidateQueries({ queryKey: ['xpBalance'] });
        },
        onError: () => {
            setCompletionStep('idle');
        },
    });

    // ── Real mode completion ─────────────────────────────────────
    const realMutation = useMutation<LessonCompletionResult, Error, number>({
        mutationFn: async (lessonIndex: number) => {
            if (!publicKey) throw new Error('Wallet not connected');

            setCompletionStep('submitting');
            const response = await fetch('/api/lessons/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    lessonIndex,
                    learnerWallet: publicKey.toBase58(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to complete lesson');
            }

            setCompletionStep('confirming');
            return response.json();
        },
        onSuccess: () => {
            setCompletionStep('idle');
            goeyToast.success('Lesson Completed! ✨', {
                description: 'XP earned — keep going!',
            });
            queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
            queryClient.invalidateQueries({ queryKey: ['xpBalance'] });
        },
        onError: (error) => {
            setCompletionStep('idle');
            goeyToast.error('Lesson Failed', {
                description: error.message,
            });
        },
    });

    const mutation = MOCK_MODE ? mockMutation : realMutation;

    return {
        completeLesson: mutation.mutate,
        completeLessonAsync: mutation.mutateAsync,
        isCompleting: mutation.isPending,
        completionStep,
        error: mutation.error,
        lastResult: mutation.data,
        reset: () => {
            mutation.reset();
            setCompletionStep('idle');
        },
    };
}

/**
 * Hook for finalizing a course via the backend API.
 *
 * Awards bonus XP and auto-issues a credential NFT after finalization.
 * In mock mode, simulates a successful finalization.
 */
export function useCourseFinalization(courseId: string) {
    const { publicKey } = useWallet();
    const queryClient = useQueryClient();
    const [credentialResult, setCredentialResult] = useState<{
        action: string;
        credentialAsset: string;
        signature: string;
    } | null>(null);
    const [isIssuingCredential, setIsIssuingCredential] = useState(false);

    const mutation = useMutation<LessonCompletionResult, Error>({
        mutationFn: async () => {
            if (MOCK_MODE) {
                await new Promise((r) => setTimeout(r, 800));
                return { success: true, signature: 'mock-finalize-sig', slot: 0 };
            }

            if (!publicKey) throw new Error('Wallet not connected');

            const response = await fetch('/api/courses/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    learnerWallet: publicKey.toBase58(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to finalize course');
            }

            return response.json();
        },
        onSuccess: async () => {
            goeyToast.success('Course Finalized! 🎉', {
                description: 'Bonus XP awarded — minting your credential...',
            });
            queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
            queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
            queryClient.invalidateQueries({ queryKey: ['xpBalance'] });

            if (MOCK_MODE) {
                // Simulate credential issuance
                setIsIssuingCredential(true);
                await new Promise((r) => setTimeout(r, 1200));
                setCredentialResult({
                    action: 'issued',
                    credentialAsset: 'MockCredential111111111111111111',
                    signature: 'mock-cred-sig',
                });
                setIsIssuingCredential(false);
                goeyToast.success('Credential Minted! 🎓', {
                    description: 'Your mock credential has been issued.',
                });
                return;
            }

            // Auto-issue credential NFT after finalization
            try {
                setIsIssuingCredential(true);
                const credResponse = await fetch('/api/credentials/issue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId }),
                });

                if (credResponse.ok) {
                    const result = await credResponse.json();
                    setCredentialResult(result);
                    goeyToast.success('Credential Minted! 🎓', {
                        description: 'Your on-chain credential NFT has been issued to your wallet.',
                    });
                } else {
                    goeyToast.warning('Credential Pending', {
                        description: 'Course finalized but credential minting failed. Try again from your dashboard.',
                    });
                    console.warn('[useCourseFinalization] Credential issuance failed, course still finalized');
                }
            } catch (err) {
                goeyToast.warning('Credential Pending', {
                    description: 'Course finalized but credential minting encountered an error.',
                });
                console.warn('[useCourseFinalization] Credential issuance error:', err);
            } finally {
                setIsIssuingCredential(false);
            }
        },
        onError: (error) => {
            goeyToast.error('Finalization Failed', {
                description: error.message,
            });
        },
    });

    return {
        finalize: mutation.mutate,
        finalizeAsync: mutation.mutateAsync,
        isFinalizing: mutation.isPending,
        isIssuingCredential,
        credentialResult,
        error: mutation.error,
    };
}

/**
 * Hook for course progress tracking.
 *
 * Real mode: fetches enrollment bitmap from on-chain.
 * Mock mode: uses in-memory completion tracking (no wallet needed).
 */
export function useCourseProgress(courseId: string, totalLessons: number) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    return useQuery<CourseProgressData>({
        queryKey: ['course-progress', courseId, MOCK_MODE ? 'mock' : publicKey?.toBase58()],
        queryFn: async () => {
            // ── Mock mode ─────────────────────────────────────────
            if (MOCK_MODE) {
                const completed = getMockCompleted(courseId);
                const completedCount = completed.size;
                const completedIndices = Array.from(completed).sort((a, b) => a - b);
                const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                const isFullyCompleted = completedCount >= totalLessons;

                return {
                    enrollment: null,
                    completedCount,
                    totalLessons,
                    progressPercent,
                    completedIndices,
                    isFullyCompleted,
                    isEnrolled: true, // auto-enrolled in mock mode
                };
            }

            // ── Real mode ─────────────────────────────────────────
            if (!publicKey) {
                return {
                    enrollment: null,
                    completedCount: 0,
                    totalLessons,
                    progressPercent: 0,
                    completedIndices: [],
                    isFullyCompleted: false,
                    isEnrolled: false,
                };
            }

            const enrollment = await fetchEnrollment(connection, courseId, publicKey);

            if (!enrollment) {
                return {
                    enrollment: null,
                    completedCount: 0,
                    totalLessons,
                    progressPercent: 0,
                    completedIndices: [],
                    isFullyCompleted: false,
                    isEnrolled: false,
                };
            }

            const flags = enrollment.lessonFlags;

            return {
                enrollment,
                completedCount: countCompletedLessons(flags, totalLessons),
                totalLessons,
                progressPercent: getProgressPercentage(flags, totalLessons),
                completedIndices: getCompletedLessonIndices(flags, totalLessons),
                isFullyCompleted: isCourseFullyCompleted(flags, totalLessons),
                isEnrolled: true,
            };
        },
        enabled: MOCK_MODE || (!!courseId && !!publicKey),
        staleTime: MOCK_MODE ? 2_000 : 15_000,
    });
}

/**
 * Check if a specific lesson is completed.
 * Uses data from the useCourseProgress hook.
 *
 * In mock mode, checks the completedIndices array.
 */
export function isLessonDone(
    progressData: CourseProgressData | undefined,
    lessonIndex: number
): boolean {
    if (progressData?.completedIndices?.includes(lessonIndex)) return true;
    if (!progressData?.enrollment) return false;
    return isLessonComplete(progressData.enrollment.lessonFlags, lessonIndex);
}
