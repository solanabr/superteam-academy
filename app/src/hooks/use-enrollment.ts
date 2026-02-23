"use client";

import { courseService } from "@/lib/services/course-service";
import { useUserStore } from "@/lib/store/user-store";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { useState } from "react";

export const useEnrollment = (wallet: WalletContextState) => {
  const { enrollments, enroll } = useUserStore((state) => ({
    enrollments: state.enrollments,
    enroll: state.enroll,
  }));
  const [pending, setPending] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrollInCourse = async (courseId: string): Promise<void> => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError("Wallet not connected");
      return;
    }

    setPending(true);
    setPendingCourseId(courseId);
    setError(null);
    try {
      const signature = await courseService.enrollInCourse(
        {
          publicKey: wallet.publicKey,
          sendTransaction: wallet.sendTransaction,
        },
        courseId,
      );
      enroll(courseId);
      setLastSignature(signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setPending(false);
      setPendingCourseId(null);
    }
  };

  return {
    enrollments,
    pending,
    pendingCourseId,
    lastSignature,
    error,
    isEnrolled: (courseId: string) => enrollments.includes(courseId),
    enrollInCourse,
  };
};
