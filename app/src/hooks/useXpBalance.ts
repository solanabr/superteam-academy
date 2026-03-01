"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getXpData } from "@/types";
import type { XpData } from "@/types";
import { supabase } from "@/lib/supabase";

export function useXpBalance() {
  const { publicKey } = useWallet();
  const [data, setData] = useState<XpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey || !supabase) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: row } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("wallet_address", publicKey.toBase58())
        .maybeSingle();

      const xp = row?.total_xp ?? 0;
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
