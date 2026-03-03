"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  fetchEnrollment,
  buildEnrollTransaction,
  fetchXPBalance,
  EnrollmentData,
} from "@/lib/onchain/LearningProgressService";

export function useEnrollment(courseId: string) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpBalance, setXpBalance] = useState(0);

  // Fetch enrollment status on mount
  useEffect(() => {
    if (!publicKey || !courseId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEnrollment(publicKey, courseId);
        setEnrollment(data);
        setIsEnrolled(data !== null);

        const xp = await fetchXPBalance(publicKey);
        setXpBalance(xp);
      } catch (err) {
        console.error("Failed to fetch enrollment:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [publicKey, courseId]);

  // Enroll in course — learner signs real devnet transaction
  const enroll = useCallback(async () => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setIsEnrolling(true);
    setError(null);

    try {
      const transaction = await buildEnrollTransaction(publicKey, courseId);
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Refresh enrollment data
      const data = await fetchEnrollment(publicKey, courseId);
      setEnrollment(data);
      setIsEnrolled(true);

      return signature;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Enrollment failed";
      // Handle already enrolled case
      if (message.includes("already in use") || message.includes("0x0")) {
        const data = await fetchEnrollment(publicKey, courseId);
        if (data) {
          setEnrollment(data);
          setIsEnrolled(true);
          return;
        }
      }
      setError(message);
      throw err;
    } finally {
      setIsEnrolling(false);
    }
  }, [publicKey, courseId, sendTransaction, connection]);

  // Get lesson completion status from bitmap
  const isLessonComplete = useCallback((lessonIndex: number): boolean => {
    if (!enrollment) return false;
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    if (wordIndex >= enrollment.lessonFlags.length) return false;
    return (enrollment.lessonFlags[wordIndex] & (1 << bitIndex)) !== 0;
  }, [enrollment]);

  // Calculate progress percentage
  const progressPercent = useCallback((totalLessons: number): number => {
    if (!enrollment || totalLessons === 0) return 0;
    let completed = 0;
    for (let i = 0; i < totalLessons; i++) {
      if (isLessonComplete(i)) completed++;
    }
    return Math.round((completed / totalLessons) * 100);
  }, [enrollment, isLessonComplete]);

  return {
    enrollment,
    isEnrolled,
    isLoading,
    isEnrolling,
    error,
    xpBalance,
    enroll,
    isLessonComplete,
    progressPercent,
  };
}
