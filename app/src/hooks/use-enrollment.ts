"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getServices } from "@/lib/services";
import type { EnrollmentData, TransactionResult } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  byWallet: (wallet: string) => [...enrollmentKeys.all, wallet] as const,
  detail: (wallet: string, courseId: string) =>
    [...enrollmentKeys.byWallet(wallet), courseId] as const,
};

// On-chain data: 30 second stale time
const ONCHAIN_STALE_TIME = 30 * 1000;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches the enrollment record for the connected wallet and a given course.
 * Returns null when the wallet is not enrolled.
 * Disabled when wallet is not connected or courseId is empty.
 */
export function useEnrollment(courseId: string) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery<EnrollmentData | null, Error>({
    queryKey: enrollmentKeys.detail(wallet, courseId),
    queryFn: () => getServices().enrollment.getEnrollment(courseId, wallet),
    staleTime: ONCHAIN_STALE_TIME,
    enabled: wallet.length > 0 && courseId.length > 0,
  });
}

/**
 * Fetches all enrollments for the connected wallet across every course.
 * Disabled when wallet is not connected.
 */
export function useUserEnrollments() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery<EnrollmentData[], Error>({
    queryKey: enrollmentKeys.byWallet(wallet),
    queryFn: () => getServices().enrollment.getUserEnrollments(wallet),
    staleTime: ONCHAIN_STALE_TIME,
    enabled: wallet.length > 0,
  });
}

/**
 * Mutation that enrolls the connected wallet in a course.
 * On success, invalidates the enrollment cache for the current wallet so
 * related queries re-fetch automatically.
 */
export function useEnroll() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const queryClient = useQueryClient();

  return useMutation<TransactionResult, Error, string>({
    mutationFn: (courseId: string) =>
      getServices().enrollment.enroll(courseId),
    onSuccess: (_result, courseId) => {
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.detail(wallet, courseId),
      });
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.byWallet(wallet),
      });
    },
  });
}

/**
 * Mutation that closes (withdraws from) an enrollment for the connected wallet.
 * On success, invalidates the enrollment cache for the current wallet.
 */
export function useCloseEnrollment() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const queryClient = useQueryClient();

  return useMutation<TransactionResult, Error, string>({
    mutationFn: (courseId: string) =>
      getServices().enrollment.closeEnrollment(courseId),
    onSuccess: (_result, courseId) => {
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.detail(wallet, courseId),
      });
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.byWallet(wallet),
      });
    },
  });
}
