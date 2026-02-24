'use client';

import { useCallback, useState } from 'react';
import {
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/lib/stores/user-store';
import type { EnrollmentData } from '@/lib/stores/user-store';
import { buildEnrollInstruction } from '@/lib/solana/enrollment';

interface UseEnrollmentReturn {
  enrollment: EnrollmentData | null;
  isEnrolled: boolean;
  enroll: (prerequisiteCourseId?: string) => Promise<string>;
  completeLesson: (lessonIndex: number) => Promise<void>;
  finalizeCourse: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Manages enrollment lifecycle for a single course.
 *
 * - `enroll()` builds the on-chain instruction, signs via wallet adapter,
 *    and submits the transaction.
 * - `completeLesson()` / `finalizeCourse()` hit the backend API routes
 *    which handle server-side signing (authority cranks the instruction).
 */
export function useEnrollment(courseId: string): UseEnrollmentReturn {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const enrollments = useUserStore((s) => s.enrollments);
  const addEnrollment = useUserStore((s) => s.addEnrollment);
  const updateEnrollmentProgress = useUserStore((s) => s.updateEnrollmentProgress);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollment = enrollments.get(courseId) ?? null;
  const isEnrolled = enrollment !== null;

  const enroll = useCallback(
    async (prerequisiteCourseId?: string): Promise<string> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }
      if (isEnrolled) {
        throw new Error(`Already enrolled in course: ${courseId}`);
      }

      setIsLoading(true);
      setError(null);

      try {
        const instruction = buildEnrollInstruction(
          courseId,
          publicKey,
          prerequisiteCourseId,
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash('confirmed');

        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: [instruction],
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const signed = await signTransaction(transaction);

        const signature = await connection.sendRawTransaction(
          signed.serialize(),
          { skipPreflight: false, preflightCommitment: 'confirmed' },
        );

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          'confirmed',
        );

        addEnrollment({
          courseId,
          completedLessons: 0,
          totalLessons: 0,
          progressPercent: 0,
          isFinalized: false,
        });

        return signature;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Enrollment transaction failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [
      publicKey,
      signTransaction,
      connection,
      courseId,
      isEnrolled,
      addEnrollment,
    ],
  );

  const completeLesson = useCallback(
    async (lessonIndex: number): Promise<void> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      if (!isEnrolled) {
        throw new Error(`Not enrolled in course: ${courseId}`);
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/lessons/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonIndex,
            wallet: publicKey.toBase58(),
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ??
              `Failed to complete lesson (HTTP ${response.status})`,
          );
        }

        // Consume response body; the API returns { signature, lessonIndex, courseId }
        // but we compute progress locally from the existing enrollment state.
        await response.json();

        // Increment the completed count by 1 from the current enrollment state.
        const currentCompleted = enrollment?.completedLessons ?? 0;
        const currentTotal = enrollment?.totalLessons ?? 0;
        updateEnrollmentProgress(
          courseId,
          currentCompleted + 1,
          currentTotal,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Lesson completion failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, courseId, isEnrolled, enrollment, updateEnrollmentProgress],
  );

  const finalizeCourse = useCallback(async (): Promise<void> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    if (!isEnrolled) {
      throw new Error(`Not enrolled in course: ${courseId}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          wallet: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            `Failed to finalize course (HTTP ${response.status})`,
        );
      }

      addEnrollment({
        ...(enrollment ?? {
          courseId,
          completedLessons: 0,
          totalLessons: 0,
          progressPercent: 100,
        }),
        isFinalized: true,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Course finalization failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, courseId, isEnrolled, enrollment, addEnrollment]);

  return {
    enrollment,
    isEnrolled,
    enroll,
    completeLesson,
    finalizeCourse,
    isLoading,
    error,
  };
}
