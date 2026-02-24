'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/lib/stores/user-store';
import type { Credential } from '@/lib/solana/credentials';

interface UseCredentialsReturn {
  credentials: Credential[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Provides the user's on-chain credentials (NFTs) from the user store,
 * with a `refresh()` action that re-fetches all user data (including
 * credentials from Helius DAS) and updates the store.
 */
export function useCredentials(): UseCredentialsReturn {
  const { publicKey } = useWallet();
  const credentials = useUserStore((s) => s.credentials);
  const storeLoading = useUserStore((s) => s.isLoading);
  const fetchUserData = useUserStore((s) => s.fetchUserData);

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setRefreshing(true);

    try {
      await fetchUserData(publicKey);
    } finally {
      setRefreshing(false);
    }
  }, [publicKey, fetchUserData]);

  return {
    credentials,
    isLoading: storeLoading || refreshing,
    refresh,
  };
}
