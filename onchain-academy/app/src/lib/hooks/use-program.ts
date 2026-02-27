"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@/lib/wallet/context";
import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import IDL_JSON from "@/lib/solana/idl/onchain_academy.json";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new Program(IDL_JSON as Idl, provider);
  }, [connection, wallet]);
}
