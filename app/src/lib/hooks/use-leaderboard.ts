'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface LeaderboardEntry {
  wallet: string;
  xpBalance: number;
  level: number;
  rank: number;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches leaderboard data from the backend API and tracks
 * the connected user's rank within the results.
 *
 * Auto-fetches on mount and exposes a manual `refresh()` for polling
 * or pull-to-refresh patterns.
 */
export function useLeaderboard(): UseLeaderboardReturn {
  const { publicKey } = useWallet();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent state updates on unmounted component
  const mountedRef = useRef(true);

  const fetchLeaderboard = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leaderboard');

      if (!response.ok) {
        throw new Error(`Leaderboard fetch failed (HTTP ${response.status})`);
      }

      const data = (await response.json()) as { entries: LeaderboardEntry[] };

      if (!mountedRef.current) return;

      setEntries(data.entries);
    } catch (err) {
      if (!mountedRef.current) return;

      const message =
        err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchLeaderboard();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchLeaderboard]);

  const userRank = publicKey
    ? entries.find((e) => e.wallet === publicKey.toBase58())?.rank ?? null
    : null;

  return {
    entries,
    userRank,
    isLoading,
    error,
    refresh: fetchLeaderboard,
  };
}
