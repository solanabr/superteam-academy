"use client";

import { useAccount, useSolanaClient, useWallet } from "@solana/connector/react";
import { type Address } from "@solana/kit";
import { fetchMaybeEnrollment } from "@superteam/academy-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEnrollmentPda } from "@/lib/academy/pdas";
import { useLessonCompletion } from "./use-lesson-completion";

export type EnrollmentStatus = {
  enrolled: boolean;
  completedLessons: number[];
  completedSet: Set<number>;
  totalLessons: number;
  loading: boolean;
  refetch: () => Promise<void>;
};

function getCompletedFromBitmap(lessonFlags: bigint[], totalLessons: number): number[] {
  const one = BigInt(1);
  const zero = BigInt(0);
  const completed: number[] = [];
  for (let lessonIndex = 0; lessonIndex < totalLessons; lessonIndex += 1) {
    const word = Math.floor(lessonIndex / 64);
    const bit = lessonIndex % 64;
    const mask = one << BigInt(bit);
    const flagsWord = lessonFlags[word] ?? zero;
    if ((flagsWord & mask) !== zero) {
      completed.push(lessonIndex);
    }
  }
  return completed;
}

export function useEnrollmentStatus(
  courseId: string,
  totalLessons?: number
): EnrollmentStatus {
  const total = totalLessons ?? 15;
  const { isConnected } = useWallet();
  const { address } = useAccount();
  const { client, ready } = useSolanaClient();
  const { completedLessons: localCompletedLessons } = useLessonCompletion(courseId);

  const [enrolled, setEnrolled] = useState(false);
  const [onChainCompletedLessons, setOnChainCompletedLessons] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isConnected || !address || !ready || !client) {
      setEnrolled(false);
      setOnChainCompletedLessons([]);
      return;
    }

    setLoading(true);
    try {
      const enrollmentPda = await getEnrollmentPda(courseId, address as Address);
      const maybeEnrollment = await fetchMaybeEnrollment(client.rpc, enrollmentPda);
      if (!maybeEnrollment.exists) {
        setEnrolled(false);
        setOnChainCompletedLessons([]);
        return;
      }

      setEnrolled(true);
      setOnChainCompletedLessons(
        getCompletedFromBitmap(maybeEnrollment.data.lessonFlags, total)
      );
    } catch (error) {
      console.error("Failed to fetch enrollment status", error);
      setEnrolled(false);
      setOnChainCompletedLessons([]);
    } finally {
      setLoading(false);
    }
  }, [address, client, courseId, isConnected, ready, total]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const completedLessons = useMemo(
    () => [...new Set([...localCompletedLessons, ...onChainCompletedLessons])].sort((a, b) => a - b),
    [localCompletedLessons, onChainCompletedLessons]
  );
  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons]);

  return {
    enrolled,
    completedLessons,
    completedSet,
    totalLessons: total,
    loading,
    refetch,
  };
}
