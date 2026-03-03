"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getXpData } from "@/types";
import type { XpData } from "@/types";
import { fetchXpBalance } from "@/lib/solana";

export function useXpBalance() {
  const { publicKey } = useWallet();
  const [data, setData] = useState<XpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const xp = await fetchXpBalance(publicKey.toBase58());
      setData(getXpData(xp));
    } catch (err) {
      setError(String(err));
      setData(getXpData(0));
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
