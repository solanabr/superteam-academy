"use client";

import { useQuery } from "@tanstack/react-query";
import { getCredentialsByOwner, isCredentialsConfigAvailable } from "@/lib/services/credentials-das";

/**
 * Fetch credentials for any wallet address (not just the connected one).
 */
export function useCredentialsFor(walletAddress: string | null) {
    return useQuery({
        queryKey: ["credentials", walletAddress ?? ""],
        queryFn: () => getCredentialsByOwner(walletAddress!),
        enabled: !!walletAddress && isCredentialsConfigAvailable(),
    });
}
