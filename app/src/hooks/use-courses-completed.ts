"use client";

import { useState, useEffect } from "react";
import { getDashboardCourseCards } from "@/lib/courses";
import { useBulkEnrollments } from "@/hooks/use-bulk-enrollments";
import { useOnChainProgress } from "@/hooks/use-onchain-progress";
import type { CourseCardData } from "@/types/course";

/**
 * Computes courses completed = credential NFTs + finalized enrollments without credentials.
 * Works for any wallet address (own profile or someone else's).
 */
export function useCoursesCompleted(walletAddress: string | null | undefined) {
  const [allCourses, setAllCourses] = useState<CourseCardData[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    getDashboardCourseCards()
      .then(setAllCourses)
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  const { enrollments, loading: loadingEnrollments } = useBulkEnrollments(allCourses, walletAddress);
  const { credentialCoursesCompleted, credentials, loading: credentialsLoading } = useOnChainProgress(walletAddress);

  const finalizedWithoutCredential = enrollments.filter(
    (e) =>
      (e.progressPct >= 100 || e.completedAt !== null) &&
      (!e.credentialAsset ||
        e.credentialAsset.toBase58() === "11111111111111111111111111111111"),
  ).length;

  const coursesCompleted = credentialCoursesCompleted + finalizedWithoutCredential;
  const loading = loadingCourses || loadingEnrollments || credentialsLoading;

  return {
    coursesCompleted,
    credentials,
    credentialCoursesCompleted,
    allCourses,
    enrollments,
    loading,
    loadingCourses,
    loadingEnrollments,
  };
}
