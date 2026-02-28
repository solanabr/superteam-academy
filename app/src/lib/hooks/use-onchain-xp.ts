"use client";
import { useState, useEffect } from "react";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { useConnection } from "@solana/wallet-adapter-react";
import { getOnChainXpBalance } from "@/lib/onchain";

export function useOnChainXp(): { xp: number; isOnChain: boolean } {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      setXp(0);
      return;
    }
    getOnChainXpBalance(publicKey.toBase58(), connection)
      .then(setXp)
      .catch(() => {});
  }, [publicKey, connection]);

  return { xp, isOnChain: xp > 0 };
}
