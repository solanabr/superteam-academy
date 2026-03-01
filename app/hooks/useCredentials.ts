"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { CredentialInfo } from "@/lib/services/learning-progress";

export function useCredentials() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery({
    queryKey: ["credentials", wallet],
    queryFn: async (): Promise<CredentialInfo[]> => {
      const res = await fetch(`/api/credentials?wallet=${encodeURIComponent(wallet)}`);
      const data = (await res.json()) as { credentials?: CredentialInfo[] };
      return data.credentials ?? [];
    },
    enabled: !!wallet,
  });
}

export function useCredentialAsset(assetId: string | null) {
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: ["credentialAsset", assetId ?? ""],
    queryFn: async () => {
      const res = await fetch(`/api/credentials/asset?id=${encodeURIComponent(assetId!)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!assetId && !!publicKey,
  });
}
