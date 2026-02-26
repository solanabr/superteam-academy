"use client";

import { useEffect, useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { setSolanaContext } from "@/lib/solana/context";

const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
const HELIUS_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? null;

export function SolanaContextBridge() {
  const { connection } = useConnection();
  const xpMint = useMemo(
    () => (XP_MINT ? new PublicKey(XP_MINT) : null),
    []
  );

  useEffect(() => {
    setSolanaContext(connection, xpMint, HELIUS_URL);
    return () => setSolanaContext(null, null, null);
  }, [connection, xpMint]);

  return null;
}
