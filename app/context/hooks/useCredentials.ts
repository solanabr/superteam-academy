'use client';

/**
 * React hook for fetching user credentials (Metaplex Core NFTs).
 *
 * Uses the Helius DAS API via helius-service to fetch credentials
 * owned by a wallet, optionally filtered by track collection.
 */
import { useQuery } from '@tanstack/react-query';
import {
    getCredentials,
    type CredentialInfo,
} from '@/context/solana/helius-service';

/**
 * Fetch all credentials owned by a wallet.
 *
 * @param walletAddress - The wallet address (base58), or null if not connected
 * @param trackCollections - Optional: filter by track collection addresses
 */
export function useCredentials(
    walletAddress: string | null,
    trackCollections?: string[]
) {
    return useQuery<CredentialInfo[]>({
        queryKey: ['credentials', walletAddress, trackCollections],
        queryFn: async () => {
            if (!walletAddress) return [];
            return getCredentials(walletAddress, trackCollections);
        },
        enabled: !!walletAddress,
        staleTime: 60_000,       // 1 minute — credentials rarely change
        refetchInterval: 300_000, // Refresh every 5 minutes
    });
}

/**
 * Fetch credential status for a specific course enrollment.
 * Uses the API rather than direct on-chain access.
 */
export function useCredentialStatus(
    courseId: string | null,
    walletAddress: string | null
) {
    return useQuery<{
        hasCredential: boolean;
        credentialAsset: string | null;
        finalized: boolean;
    }>({
        queryKey: ['credentialStatus', courseId, walletAddress],
        queryFn: async () => {
            if (!courseId || !walletAddress) {
                return { hasCredential: false, credentialAsset: null, finalized: false };
            }

            // Use the credentials hook data to check if this course has a credential
            const credentials = await getCredentials(walletAddress);
            const match = credentials.find(c => c.assetId === courseId);

            return {
                hasCredential: !!match,
                credentialAsset: match?.assetId ?? null,
                finalized: !!match,
            };
        },
        enabled: !!courseId && !!walletAddress,
        staleTime: 60_000,
    });
}
