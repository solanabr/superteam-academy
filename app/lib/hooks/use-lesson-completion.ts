"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useTransactionSigner,
  useWallet,
} from "@solana/connector/react";
import { toast } from "sonner";
import {
  AcademyApiError,
  completeLessonWithWalletAuth,
} from "@/lib/academy/complete-lesson";
import { useEnrollmentStatus } from "./use-enrollment-status";

function mapCompletionError(error: unknown): string {
  if (error instanceof AcademyApiError) {
    switch (error.code) {
      case "INVALID_SIGNATURE":
      case "INVALID_WALLET_BINDING":
      case "INTENT_MISMATCH":
        return "Wallet authentication failed. Please sign again.";
      case "REPLAYED_NONCE":
        return "This signature was already used. Please try again.";
      case "EXPIRED_MESSAGE":
        return "Signature request expired. Please try again.";
      case "SIGN_MESSAGE_UNSUPPORTED":
        return "Your wallet does not support message signing.";
      case "SIGNATURE_REJECTED":
      case "SIGN_MESSAGE_FAILED":
        return (
          error.message ||
          "Wallet could not sign. Try again or use another wallet."
        );
      case "NOT_ENROLLED":
        return "Enroll in this course before completing lessons.";
      case "LESSON_ALREADY_COMPLETED":
        return "This lesson is already completed.";
      case "LESSON_OUT_OF_BOUNDS":
        return "This lesson is beyond the course’s on-chain lesson count. The course may need to be re-created with more lessons.";
      case "COMPLETE_LESSON_FAILED":
        return "Could not complete lesson on-chain. Check the backend log or try again.";
      default:
        return `Failed to complete lesson (${error.code}).`;
    }
  }
  if (error instanceof Error) return error.message;
  return "Failed to complete lesson.";
}

export type LessonCompletionState = {
  completedLessons: number[];
  completedSet: Set<number>;
  markComplete: (lessonIndex: number) => Promise<void>;
  isComplete: (lessonIndex: number) => boolean;
  isMarkingComplete: boolean;
  error: string | null;
  enrolled: boolean;
  connected: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useLessonCompletion(
  courseId: string,
  totalLessons?: number,
): LessonCompletionState {
  const { isConnected } = useWallet();
  const { address } = useAccount();
  const { signer } = useTransactionSigner();
  const {
    enrolled,
    loading,
    refetch,
    completedLessons: onChainCompletedLessons,
  } = useEnrollmentStatus(courseId, totalLessons);

  const [optimisticCompleted, setOptimisticCompleted] = useState<number[]>([]);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onChainSet = new Set(onChainCompletedLessons);
    setOptimisticCompleted((previous) =>
      previous.filter((lessonIndex) => !onChainSet.has(lessonIndex)),
    );
  }, [onChainCompletedLessons]);

  const completedLessons = useMemo(
    () =>
      [...new Set([...onChainCompletedLessons, ...optimisticCompleted])].sort(
        (a, b) => a - b,
      ),
    [onChainCompletedLessons, optimisticCompleted],
  );
  const completedSet = useMemo(
    () => new Set(completedLessons),
    [completedLessons],
  );

  const markComplete = useCallback(
    async (lessonIndex: number) => {
      if (completedSet.has(lessonIndex) || isMarkingComplete) return;

      setError(null);
      setIsMarkingComplete(true);
      setOptimisticCompleted((previous) => [
        ...new Set([...previous, lessonIndex]),
      ]);

      try {
        if (!isConnected || !address) {
          throw new AcademyApiError(
            "INVALID_WALLET_BINDING",
            401,
            "Connect your wallet to complete lessons on-chain.",
          );
        }
        if (!enrolled) {
          throw new AcademyApiError("NOT_ENROLLED", 403);
        }
        if (!signer?.signMessage) {
          throw new AcademyApiError(
            "SIGN_MESSAGE_UNSUPPORTED",
            400,
            "Wallet is connected but cannot sign messages yet.",
          );
        }

        const result = await completeLessonWithWalletAuth({
          wallet: address,
          courseId,
          lessonIndex,
          signer,
        });

        toast.success("Lesson completed on-chain", {
          description: `${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`,
        });
        await refetch();
      } catch (markError) {
        setOptimisticCompleted((previous) =>
          previous.filter((value) => value !== lessonIndex),
        );
        const message = mapCompletionError(markError);
        setError(message);
        toast.error(message);
        throw markError;
      } finally {
        setIsMarkingComplete(false);
      }
    },
    [
      address,
      completedSet,
      courseId,
      enrolled,
      isConnected,
      isMarkingComplete,
      refetch,
      signer,
    ],
  );

  const isComplete = useCallback(
    (lessonIndex: number) => completedSet.has(lessonIndex),
    [completedSet],
  );

  return {
    completedLessons,
    completedSet,
    markComplete,
    isComplete,
    isMarkingComplete,
    error,
    enrolled,
    connected: isConnected,
    loading,
    refetch,
  };
}
