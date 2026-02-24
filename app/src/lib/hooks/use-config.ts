"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import {
  getReadonlyProgram,
  getAccounts,
  type ConfigAccount,
} from "@/lib/solana/program";
import { findConfigPDA } from "@/lib/solana/pda";

export type OnChainConfig = ConfigAccount;

export function useConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<OnChainConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const program = getReadonlyProgram(connection);
      const [pda] = findConfigPDA();
      const config = await getAccounts(program).config.fetch(pda);
      setConfig(config);
    } catch {
      setConfig(null);
    }
    setLoading(false);
  }, [connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { config, loading, refresh };
}
