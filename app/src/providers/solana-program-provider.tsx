"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/solana/program";
import { progressService } from "@/services";
import { DevnetProgressService } from "@/services/onchain/progress.service";

/**
 * Creates an Anchor Program backed by the connected wallet and injects
 * it into the DevnetProgressService. Must be placed inside WalletProvider.
 */
export function SolanaProgramProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(
    () => getProgram(connection, wallet),
    [
      connection,
      wallet.publicKey,
      wallet.signTransaction,
      wallet.signAllTransactions,
    ],
  );

  useEffect(() => {
    if (progressService instanceof DevnetProgressService) {
      progressService.setProgram(program);
    }
    return () => {
      if (progressService instanceof DevnetProgressService) {
        progressService.setProgram(null);
      }
    };
  }, [program]);

  return <>{children}</>;
}
