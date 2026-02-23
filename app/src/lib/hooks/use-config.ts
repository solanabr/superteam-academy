"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import { getReadonlyProgram } from "@/lib/solana/program";
import { findConfigPDA } from "@/lib/solana/pda";

export interface OnChainConfig {
  authority: any;
  backendSigner: any;
  xpMint: any;
  bump: number;
}

export function useConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<OnChainConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const program = getReadonlyProgram(connection);
      const [pda] = findConfigPDA();
      const account = await (program.account as any).config.fetch(pda);
      setConfig(account as unknown as OnChainConfig);
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
