"use client";

import { useQuery } from "@tanstack/react-query";
import type { CredentialInfo } from "@/lib/services/learning-progress";

/**
 * Fetch credentials for any wallet address via Helius DAS (server-side API).
 */
export function useCredentialsFor(walletAddress: string | null) {
  return useQuery({
    queryKey: ["credentials", walletAddress ?? ""],
    queryFn: async (): Promise<CredentialInfo[]> => {
      if (!walletAddress) return [];
      const res = await fetch(`/api/credentials?wallet=${encodeURIComponent(walletAddress)}`);
      const data = (await res.json()) as { credentials?: CredentialInfo[] };
      return data.credentials ?? [];
    },
    enabled: !!walletAddress,
  });
}
