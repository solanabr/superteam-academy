"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { PublicKey } from "@solana/web3.js";
import { fetchEnrollments, type OnChainEnrollment } from "@/lib/solana/enrollments";
import type { CourseCardData } from "@/types/course";

/**
 * Batch-fetches on-chain enrollment state for all given courses.
 * One RPC call via getMultipleAccountsInfo regardless of course count.
 */
export function useBulkEnrollments(courses: CourseCardData[]) {
  const { publicKey: adapterKey } = useWallet();
  const { data: session } = useSession();

  // Determine the effective wallet address to check
  const walletAddress = useMemo(() => {
    if (adapterKey) return adapterKey;
    if (session?.walletAddress) {
      try {
        return new PublicKey(session.walletAddress);
      } catch {
        return null;
      }
    }
    return null;
  }, [adapterKey, session]);

  const [enrollments, setEnrollments] = useState<OnChainEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const enrollable = courses.filter((c) => !!c.courseId);

    if (!walletAddress || !enrollable.length) {
      setEnrollments([]);
      return;
    }

    setLoading(true);
    fetchEnrollments(
      enrollable.map((c) => ({ courseId: c.courseId!, totalLessons: c.totalLessons })),
      walletAddress,
    )
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [walletAddress, courses]);

  /** Look up enrollment by on-chain courseId */
  function getEnrollment(courseId: string): OnChainEnrollment | undefined {
    return enrollments.find((e) => e.courseId === courseId);
  }

  return { enrollments, loading, getEnrollment };
}
