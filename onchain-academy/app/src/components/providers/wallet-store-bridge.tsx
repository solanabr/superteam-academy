"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletStore } from "@/stores/wallet-store";

export function WalletStoreBridge() {
  const { connected, publicKey, wallet } = useWallet();
  const setConnection = useWalletStore((state) => state.setConnection);

  useEffect(() => {
    const inferredKind =
      wallet?.adapter.name.toLowerCase().includes("phantom")
        ? "phantom"
        : wallet?.adapter.name.toLowerCase().includes("solflare")
          ? "solflare"
          : wallet?.adapter.name.toLowerCase().includes("backpack")
            ? "backpack"
            : null;

    setConnection(connected, publicKey?.toBase58() ?? null, inferredKind);
  }, [connected, publicKey, setConnection, wallet?.adapter.name]);

  return null;
}

