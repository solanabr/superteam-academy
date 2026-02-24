"use client";

import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConfig } from "./useConfig";
import { useMemo } from "react";

export type AdminRole = "authority" | "backend_signer";

function toPubkey(v: unknown): PublicKey | null {
  if (!v) return null;
  if (v instanceof PublicKey) return v;
  if (typeof v === "string") {
    try {
      return new PublicKey(v);
    } catch {
      return null;
    }
  }
  if (typeof v === "object" && v !== null && "toBase58" in v) {
    try {
      return new PublicKey((v as { toBase58: () => string }).toBase58());
    } catch {
      return null;
    }
  }
  return null;
}

export function useIsAdmin(): {
  isAdmin: boolean;
  role: AdminRole | null;
  isLoading: boolean;
} {
  const { publicKey } = useWallet();
  const { data: config, isLoading: configLoading, isFetched } = useConfig();

  return useMemo(() => {
    if (!publicKey) {
      return { isAdmin: false, role: null, isLoading: configLoading };
    }
    if (!config || !isFetched) {
      return { isAdmin: false, role: null, isLoading: configLoading };
    }

    const authority =
      toPubkey(config.authority) ??
      toPubkey((config as { authority?: unknown }).authority);
    const backendSigner =
      toPubkey(config.backendSigner) ??
      toPubkey((config as { backend_signer?: unknown }).backend_signer);

    const walletStr = publicKey.toBase58();
    if (authority && authority.toBase58() === walletStr) {
      return { isAdmin: true, role: "authority", isLoading: false };
    }
    if (backendSigner && backendSigner.toBase58() === walletStr) {
      return { isAdmin: true, role: "backend_signer", isLoading: false };
    }
    return { isAdmin: false, role: null, isLoading: false };
  }, [publicKey, config, configLoading, isFetched]);
}
