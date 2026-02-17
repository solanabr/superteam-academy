"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { fetchEnrollment } from "../academy-reads";
import { decodeLessonBitmap, isAllLessonsComplete } from "../bitmap";
import { PROGRAM_ID } from "../pda";

interface UseEnrollmentResult {
  enrollment: Record<string, unknown> | null;
  isEnrolled: boolean;
  isLoading: boolean;
  error: string | null;
  lessonProgress: boolean[];
  isCompleted: boolean;
  refetch: () => void;
}

export function useEnrollment(
  courseId: string,
  lessonCount: number = 0
): UseEnrollmentResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [enrollment, setEnrollment] = useState<Record<string, unknown> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey || !courseId) {
      setEnrollment(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchEnrollment(
        courseId,
        publicKey,
        connection,
        PROGRAM_ID
      );
      setEnrollment(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch enrollment"
      );
      setEnrollment(null);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, publicKey, connection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lessonProgress = enrollment
    ? decodeLessonBitmap(
        enrollment.lessonFlags as (bigint | number)[],
        lessonCount
      )
    : [];

  const isCompleted = enrollment
    ? isAllLessonsComplete(
        enrollment.lessonFlags as (bigint | number)[],
        lessonCount
      )
    : false;

  return {
    enrollment,
    isEnrolled: !!enrollment,
    isLoading,
    error,
    lessonProgress,
    isCompleted,
    refetch: fetchData,
  };
}
