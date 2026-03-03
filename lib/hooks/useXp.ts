import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { XpService } from '@/lib/services/xp.service';
import { createCredentialService } from '@/lib/services/credential.service';

/**
 * Hook: Get XP balance for wallet
 */
export function useXpBalance(walletAddress?: PublicKey, xpMintAddress?: PublicKey) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['xp:balance', walletAddress?.toString(), xpMintAddress?.toString()],
    queryFn: async () => {
      if (!walletAddress || !xpMintAddress) return 0;
      const service = new XpService(connection);
      return await service.getXpBalance(walletAddress, xpMintAddress);
    },
    enabled: !!walletAddress && !!xpMintAddress,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Get XP level
 */
export function useXpLevel(walletAddress?: PublicKey, xpMintAddress?: PublicKey) {
  const { data: xpBalance } = useXpBalance(walletAddress, xpMintAddress);

  return {
    totalXp: xpBalance || 0,
    level: xpBalance ? XpService.calculateLevel(xpBalance) : 0,
    xpForNextLevel: xpBalance ? XpService.calculateXpForNextLevel(xpBalance) : 100,
    formattedXp: xpBalance ? XpService.formatXp(xpBalance) : '0',
  };
}

/**
 * Hook: Get learner credentials
 */
export function useCredentials(
  walletAddress?: PublicKey,
  trackCollectionAddress?: PublicKey,
  heliusRpcUrl?: string
) {
  return useQuery({
    queryKey: ['credentials', walletAddress?.toString(), trackCollectionAddress?.toString()],
    queryFn: async () => {
      if (!walletAddress) return [];
      const service = createCredentialService(heliusRpcUrl);
      return await service.getCredentials(walletAddress, trackCollectionAddress);
    },
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000, // 10 minutes for credentials
  });
}

/**
 * Hook: Get credential by track
 */
export function useCredentialByTrack(
  walletAddress?: PublicKey,
  trackId?: string,
  trackCollectionAddress?: PublicKey,
  heliusRpcUrl?: string
) {
  return useQuery({
    queryKey: ['credential:track', walletAddress?.toString(), trackId, trackCollectionAddress?.toString()],
    queryFn: async () => {
      if (!walletAddress || !trackId || !trackCollectionAddress) return null;
      const service = createCredentialService(heliusRpcUrl);
      return await service.getCredentialByTrack(walletAddress, trackId, trackCollectionAddress);
    },
    enabled: !!walletAddress && !!trackId && !!trackCollectionAddress,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Check if wallet has credentials
 */
export function useHasCredentials(
  walletAddress?: PublicKey,
  trackCollectionAddress?: PublicKey,
  heliusRpcUrl?: string
) {
  const { data: credentials } = useCredentials(walletAddress, trackCollectionAddress, heliusRpcUrl);

  return {
    hasCredentials: (credentials?.length || 0) > 0,
    credentialCount: credentials?.length || 0,
    credentials: credentials || [],
  };
}
