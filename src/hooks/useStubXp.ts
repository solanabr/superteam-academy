"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getStubXp } from "@/lib/stubStorage";

/**
 * Returns the local (demo) XP total accumulated via stub lesson completions.
 * Returns 0 server-side or when wallet is disconnected.
 */
export function useStubXp(): number {
  const { publicKey } = useWallet();
  if (!publicKey || typeof window === "undefined") return 0;
  return getStubXp(publicKey.toBase58());
}
