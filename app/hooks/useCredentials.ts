"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCredentialsByOwner, getAssetById, isCredentialsConfigAvailable } from "@/lib/services/credentials-das";

export function useCredentials() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery({
    queryKey: ["credentials", wallet],
    queryFn: () => getCredentialsByOwner(wallet),
    enabled: !!wallet && isCredentialsConfigAvailable(),
  });
}

export function useCredentialAsset(assetId: string | null) {
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: ["credentialAsset", assetId ?? ""],
    queryFn: () => getAssetById(assetId!),
    enabled: !!assetId && !!publicKey && isCredentialsConfigAvailable(),
  });
}
