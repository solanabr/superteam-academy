"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";

export function useWalletCompat() {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0] ?? null;

  const publicKey = useMemo(
    () => (wallet ? new PublicKey(wallet.address) : null),
    [wallet],
  );

  return {
    connected: ready && authenticated && !!wallet,
    publicKey,
    wallet,
    disconnect: logout,
  };
}
