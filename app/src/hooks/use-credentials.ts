"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getServices } from "@/lib/services";
import type { CredentialData } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const credentialKeys = {
  all: ["credentials"] as const,
  byWallet: (wallet: string) => [...credentialKeys.all, wallet] as const,
  detail: (address: string) => [...credentialKeys.all, "detail", address] as const,
};

// On-chain data (Metaplex Core NFTs via Helius DAS): 30 second stale time
const ONCHAIN_STALE_TIME = 30 * 1000;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches all credential NFTs owned by the connected wallet.
 * Disabled when wallet is not connected.
 */
export function useCredentials() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery<CredentialData[], Error>({
    queryKey: credentialKeys.byWallet(wallet),
    queryFn: () => getServices().credential.getCredentials(wallet),
    staleTime: ONCHAIN_STALE_TIME,
    enabled: wallet.length > 0,
  });
}

/**
 * Fetches a single credential by its on-chain asset address.
 * Disabled when address is empty.
 */
export function useCredential(address: string) {
  return useQuery<CredentialData | null, Error>({
    queryKey: credentialKeys.detail(address),
    queryFn: () => getServices().credential.getCredential(address),
    staleTime: ONCHAIN_STALE_TIME,
    enabled: address.length > 0,
  });
}
