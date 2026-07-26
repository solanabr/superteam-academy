"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fetchConfig, fetchXpBalance } from "../academy-reads";
import { getProgramId } from "../pda";

interface UseXpTotalResult {
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useXpTotal(): UseXpTotalResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config = await fetchConfig(connection, getProgramId());
      if (!config) {
        setTotal(0);
        setIsLoading(false);
        return;
      }

      const result = await fetchXpBalance(
        publicKey,
        config.xp_mint as PublicKey,
        connection
      );
      setTotal(result.balance);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch XP total");
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { total, isLoading, error, refetch: fetchData };
}
