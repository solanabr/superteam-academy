'use client';

/**
 * React hooks for enrollment operations.
 *
 * Provides hooks for:
 * - Checking enrollment status
 * - Enrolling in a course (with automatic prerequisite handling)
 * - Closing enrollment
 */
import { useCallback, useState, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    buildEnrollTransaction,
    fetchEnrollment,
    checkPrerequisiteMet,
    buildCloseEnrollmentTransaction,
    type EnrollmentState,
    type PrerequisiteCheckResult,
} from '@/context/solana/enrollment-service';

/**
 * Fetch the enrollment state for the connected wallet in a course.
 * Returns null if not enrolled.
 */
export function useEnrollmentStatus(courseId: string | null) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    return useQuery<EnrollmentState | null>({
        queryKey: ['enrollment', courseId, publicKey?.toBase58()],
        queryFn: async () => {
            if (!courseId || !publicKey) return null;
            return fetchEnrollment(connection, courseId, publicKey);
        },
        enabled: !!courseId && !!publicKey,
        staleTime: 5_000, // 5 seconds — enrollment state changes frequently
    });
}

/**
 * Check if the connected wallet meets the prerequisite for a course.
 */
export function usePrerequisiteCheck(courseId: string | null) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    return useQuery<PrerequisiteCheckResult | null>({
        queryKey: ['prerequisite-check', courseId, publicKey?.toBase58()],
        queryFn: async () => {
            if (!courseId || !publicKey) return null;
            return checkPrerequisiteMet(connection, courseId, publicKey);
        },
        enabled: !!courseId && !!publicKey,
        staleTime: 60_000, // 1 minute
    });
}

/**
 * Hook for enrolling in a course.
 *
 * Returns a mutation that builds and sends the enrollment transaction.
 * Handles prerequisite remaining_accounts automatically.
 */
export function useEnroll(courseId: string) {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const queryClient = useQueryClient();
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const isEnrollingRef = useRef(false);

    const mutation = useMutation({
        mutationFn: async (prerequisiteCourseId?: string | null) => {
            if (!publicKey) throw new Error('Wallet not connected');
            if (isEnrollingRef.current) throw new Error('Enrollment already in progress');

            isEnrollingRef.current = true;
            try {
                const tx = await buildEnrollTransaction(
                    connection,
                    courseId,
                    publicKey,
                    prerequisiteCourseId
                );

                const signature = await sendTransaction(tx, connection);

                await connection.confirmTransaction(signature, 'confirmed');
                return signature;
            } finally {
                isEnrollingRef.current = false;
            }
        },
        onSuccess: (signature: string) => {
            setTxSignature(signature);
            // Invalidate enrollment queries so UI updates
            queryClient.invalidateQueries({
                queryKey: ['enrollment', courseId, publicKey?.toBase58()],
            });
        },
    });

    return {
        enroll: mutation.mutate,
        enrollAsync: mutation.mutateAsync,
        isEnrolling: mutation.isPending,
        error: mutation.error,
        txSignature,
        reset: useCallback(() => {
            mutation.reset();
            setTxSignature(null);
        }, [mutation]),
    };
}

/**
 * Hook for closing enrollment (unenrolling).
 */
export function useCloseEnrollment(courseId: string) {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!publicKey) throw new Error('Wallet not connected');

            const tx = await buildCloseEnrollmentTransaction(
                connection,
                courseId,
                publicKey
            );

            const signature = await sendTransaction(tx, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            return signature;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['enrollment', courseId],
            });
        },
    });

    return {
        closeEnrollment: mutation.mutate,
        isClosing: mutation.isPending,
        error: mutation.error,
    };
}
