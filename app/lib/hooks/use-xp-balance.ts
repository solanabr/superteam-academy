"use client";

import {
  useAccount,
  useSolanaClient,
  useWallet,
} from "@solana/connector/react";
import { address } from "@solana/kit";
import { fetchMaybeConfig } from "@superteam/academy-sdk";
import { useCallback, useEffect, useState } from "react";
import { getConfigPda, getXpAta } from "@/lib/academy/pdas";

type XpBalanceState = {
  xp: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useXpBalance(): XpBalanceState {
  const { isConnected } = useWallet();
  const { address: walletAddress } = useAccount();
  const { client, ready } = useSolanaClient();

  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isConnected || !walletAddress || !ready || !client) {
      setXp(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const configPda = await getConfigPda();
      const maybeConfig = await fetchMaybeConfig(client.rpc, configPda);
      if (!maybeConfig.exists) {
        setXp(0);
        setError("Config not initialized");
        return;
      }

      const learnerAddress = address(walletAddress);
      const xpAta = await getXpAta(learnerAddress, maybeConfig.data.xpMint);

      try {
        const balance = await client.rpc.getTokenAccountBalance(xpAta).send();
        setXp(Number(balance.value.amount));
      } catch {
        // ATA likely does not exist yet.
        setXp(0);
      }
    } catch (xpError) {
      console.error("Failed to fetch XP balance", xpError);
      setXp(0);
      setError("Failed to fetch XP balance");
    } finally {
      setLoading(false);
    }
  }, [client, isConnected, ready, walletAddress]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    xp,
    loading,
    error,
    refetch,
  };
}
