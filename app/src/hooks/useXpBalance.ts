"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchXpBalance } from "@/lib/solana";
import { getXpData } from "@/types";
import type { XpData } from "@/types";

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
      const balance = await fetchXpBalance(publicKey.toBase58());
      setData(getXpData(balance));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh };
}
