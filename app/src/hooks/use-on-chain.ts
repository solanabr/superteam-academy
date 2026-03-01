"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import {
  fetchAllCourses,
  fetchCourse,
  fetchEnrollment,
  fetchXpBalance,
  type OnChainCourse,
  type OnChainEnrollment,
} from "@/lib/solana/on-chain-service";

export function useOnChainCourses() {
  return useQuery<OnChainCourse[]>({
    queryKey: ["onchain-courses"],
    queryFn: fetchAllCourses,
    staleTime: 60_000,
  });
}

export function useOnChainCourse(courseId: string | undefined) {
  return useQuery<OnChainCourse | null>({
    queryKey: ["onchain-course", courseId],
    queryFn: () => (courseId ? fetchCourse(courseId) : null),
    enabled: !!courseId,
    staleTime: 60_000,
  });
}

export function useOnChainEnrollment(
  courseId: string | undefined,
  wallet: string | undefined,
) {
  return useQuery<OnChainEnrollment | null>({
    queryKey: ["onchain-enrollment", courseId, wallet],
    queryFn: () => {
      if (!courseId || !wallet) return null;
      return fetchEnrollment(courseId, new PublicKey(wallet));
    },
    enabled: !!courseId && !!wallet,
    staleTime: 15_000,
  });
}

export function useOnChainXp(wallet: string | undefined) {
  return useQuery<number>({
    queryKey: ["onchain-xp", wallet],
    queryFn: () => (wallet ? fetchXpBalance(new PublicKey(wallet)) : 0),
    enabled: !!wallet,
    staleTime: 15_000,
  });
}
