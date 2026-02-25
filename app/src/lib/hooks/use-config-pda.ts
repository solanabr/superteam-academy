"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@/lib/wallet/context";
import { getReadonlyProgram, getAccounts } from "@/lib/solana/program";
import { findConfigPDA } from "@/lib/solana/pda";
import type { ConfigAccount } from "@/lib/solana/program";

interface ConfigPDAState {
  config: ConfigAccount | null;
  loading: boolean;
  error: string | null;
}

export function useConfigPDA(): ConfigPDAState {
  const { connection } = useConnection();
  const [config, setConfig] = useState<ConfigAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const program = getReadonlyProgram(connection);
        const [configPDA] = findConfigPDA();
        const data = await getAccounts(program).config.fetch(configPDA);
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load Config PDA",
          );
        }
      }
      if (!cancelled) setLoading(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { config, loading, error };
}
