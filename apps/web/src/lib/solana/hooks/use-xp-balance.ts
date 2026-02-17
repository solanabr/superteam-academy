"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fetchConfig, fetchXpBalance } from "../academy-reads";
import { PROGRAM_ID } from "../pda";

interface UseXpBalanceResult {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useXpBalance(): UseXpBalanceResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config = await fetchConfig(connection, PROGRAM_ID);
      if (!config) {
        setBalance(0);
        setIsLoading(false);
        return;
      }

      const xp = await fetchXpBalance(
        publicKey,
        config.xpMint as PublicKey,
        connection
      );
      setBalance(xp);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch XP balance"
      );
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { balance, isLoading, error, refetch: fetchData };
}
