"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getConfigPda, getProgramReadOnly } from "@/lib/program";

export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
}

export function useConfig() {
  const { connection } = useConnection();
  const program = useMemo(() => getProgramReadOnly(connection), [connection]);
  const configPda = getConfigPda(program.programId);

  return useQuery({
    queryKey: ["config"],
    queryFn: async (): Promise<ConfigAccount | null> => {
      return (program.account as { config: { fetch: (p: PublicKey) => Promise<ConfigAccount> } }).config.fetch(configPda);
    },
    enabled: true,
    refetchInterval: 30_000,
  });
}
