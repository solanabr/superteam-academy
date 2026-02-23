"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCredentialsByOwner, type CredentialAsset } from "@/lib/credentials";
import { TRACK_COLLECTION } from "@/lib/constants";

export function useCredentials() {
  const { publicKey } = useWallet();

  return useQuery<CredentialAsset[]>({
    queryKey: ["credentials", publicKey?.toBase58()],
    queryFn: () =>
      getCredentialsByOwner(
        publicKey!.toBase58(),
        TRACK_COLLECTION?.toBase58()
      ),
    enabled: !!publicKey,
    staleTime: 60_000,
  });
}
