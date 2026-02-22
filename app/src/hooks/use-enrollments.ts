"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchEnrollments, type OnChainEnrollment } from "@/lib/solana/enrollments";
import type { CourseCardData } from "@/types/course";

/**
 * Batch-fetches on-chain enrollment state for all given courses.
 * One RPC call via getMultipleAccountsInfo regardless of course count.
 */
export function useEnrollments(courses: CourseCardData[]) {
  const { publicKey } = useWallet();
  const [enrollments, setEnrollments] = useState<OnChainEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const enrollable = courses.filter((c) => !!c.courseId);

    if (!publicKey || !enrollable.length) {
      setEnrollments([]);
      return;
    }

    setLoading(true);
    fetchEnrollments(
      enrollable.map((c) => ({ courseId: c.courseId!, totalLessons: c.totalLessons })),
      publicKey,
    )
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [publicKey, courses]);

  /** Look up enrollment by on-chain courseId */
  function getEnrollment(courseId: string): OnChainEnrollment | undefined {
    return enrollments.find((e) => e.courseId === courseId);
  }

  return { enrollments, loading, getEnrollment };
}
