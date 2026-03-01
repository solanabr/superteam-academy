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
export function useBulkEnrollments(courses: CourseCardData[], walletOverride?: string | null) {
  const { publicKey: adapterKey } = useWallet();
  const { data: session } = useSession();

  // Stable string: walletOverride > linked wallet from session > adapter fallback
  const walletAddressStr =
    walletOverride ?? session?.walletAddress ?? adapterKey?.toBase58() ?? null;

  const walletAddress = useMemo(() => {
    if (!walletAddressStr) return null;
    try { return new PublicKey(walletAddressStr); } catch { return null; }
  }, [walletAddressStr]);

  const [enrollments, setEnrollments] = useState<OnChainEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enrollable = courses.filter((c) => !!c.courseId);

    if (!walletAddress || !enrollable.length) {
      setEnrollments([]);
      setLoading(false);
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
