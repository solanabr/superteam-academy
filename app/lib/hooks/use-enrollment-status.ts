"use client";

import {
  useAccount,
  useSolanaClient,
  useWallet,
} from "@solana/connector/react";
import { type Address } from "@solana/kit";
import { fetchMaybeEnrollment } from "@superteam/academy-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEnrollmentPda } from "@/lib/academy/pdas";
import { getCompletedLessonIndices } from "@/lib/academy/lesson-bitmap";

export type EnrollmentStatus = {
  enrolled: boolean;
  completedLessons: number[];
  completedSet: Set<number>;
  totalLessons: number;
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useEnrollmentStatus(
  courseId: string,
  totalLessons?: number,
): EnrollmentStatus {
  const total = totalLessons ?? 256;
  const { isConnected } = useWallet();
  const { address } = useAccount();
  const { client, ready } = useSolanaClient();

  const [enrolled, setEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  console.log("completedLessons", completedLessons, total);
  const refetch = useCallback(async () => {
    if (!isConnected || !address || !ready || !client) {
      setEnrolled(false);
      setCompletedLessons([]);
      return;
    }

    setLoading(true);
    try {
      const enrollmentPda = await getEnrollmentPda(
        courseId,
        address as Address,
      );
      const maybeEnrollment = await fetchMaybeEnrollment(
        client.rpc,
        enrollmentPda,
      );
      if (!maybeEnrollment.exists) {
        setEnrolled(false);
        setCompletedLessons([]);
        return;
      }

      setEnrolled(true);
      setCompletedLessons(
        getCompletedLessonIndices(maybeEnrollment.data.lessonFlags, total),
      );
    } catch (error) {
      console.error("Failed to fetch enrollment status", error);
      setEnrolled(false);
      setCompletedLessons([]);
    } finally {
      setLoading(false);
    }
  }, [address, client, courseId, isConnected, ready, total]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const completedSet = useMemo(
    () => new Set(completedLessons),
    [completedLessons],
  );

  return {
    enrolled,
    completedLessons,
    completedSet,
    totalLessons: total,
    loading,
    refetch,
  };
}
