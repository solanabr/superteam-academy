"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getServices } from "@/lib/services";
import { calculateLevel } from "@/lib/solana/xp";
import type { LeaderboardEntry } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const xpKeys = {
  all: ["xp"] as const,
  balance: (wallet: string) => [...xpKeys.all, "balance", wallet] as const,
  leaderboard: (limit: number) => [...xpKeys.all, "leaderboard", limit] as const,
};

// On-chain data: 30 second stale time
const ONCHAIN_STALE_TIME = 30 * 1000;

// Default leaderboard size
const DEFAULT_LEADERBOARD_LIMIT = 10;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches the raw XP token balance for the connected wallet.
 * Disabled when wallet is not connected.
 */
export function useXpBalance() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery<number, Error>({
    queryKey: xpKeys.balance(wallet),
    queryFn: () => getServices().xp.getXpBalance(wallet),
    staleTime: ONCHAIN_STALE_TIME,
    enabled: wallet.length > 0,
  });
}

/**
 * Fetches the leaderboard, optionally limited to a top-N slice.
 * Always enabled — the leaderboard is public data.
 */
export function useLeaderboard(limit: number = DEFAULT_LEADERBOARD_LIMIT) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: xpKeys.leaderboard(limit),
    queryFn: () => getServices().xp.getLeaderboard(limit),
    staleTime: ONCHAIN_STALE_TIME,
  });
}

/**
 * Derives the current level from the connected wallet's XP balance.
 * Returns undefined for both xp and level when the wallet is not connected
 * or the balance query is still loading.
 */
export function useLevel() {
  const xpQuery = useXpBalance();

  const level =
    xpQuery.data !== undefined ? calculateLevel(xpQuery.data) : undefined;

  return {
    xp: xpQuery.data,
    level,
    isLoading: xpQuery.isLoading,
    isError: xpQuery.isError,
    error: xpQuery.error,
  };
}
