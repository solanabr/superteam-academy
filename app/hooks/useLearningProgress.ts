"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { fetchEnrollment, fetchXPBalance, buildEnrollTransaction } from "@/lib/onchain/LearningProgressService";
import { useConnection } from "@solana/wallet-adapter-react";

export function useLearningProgress() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const recordLesson = useCallback(async (courseId: string, lessonIndex: number) => {
    if (!publicKey) return null;
    // Lesson completion is backend-signed per the program architecture
    // Frontend tracks locally until backend integration is complete
    return null;
  }, [publicKey]);

  const recordCourse = useCallback(async (courseId: string) => {
    if (!publicKey) return null;
    // Course finalization is backend-signed per the program architecture
    return null;
  }, [publicKey]);

  const fetchProgress = useCallback(async (courseId: string) => {
    if (!publicKey) return null;
    return fetchEnrollment(publicKey, courseId);
  }, [publicKey]);

  const fetchXP = useCallback(async () => {
    if (!publicKey) return null;
    return fetchXPBalance(publicKey);
  }, [publicKey]);

  const enroll = useCallback(async (courseId: string) => {
    if (!publicKey) return null;
    const transaction = await buildEnrollTransaction(publicKey, courseId);
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  }, [publicKey, sendTransaction, connection]);

  return { recordLesson, recordCourse, fetchProgress, fetchXP, enroll };
}
