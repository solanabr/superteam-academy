// components/wallet/WalletButton.tsx

'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useUserStore } from '@/lib/store/user';
import { getProgressService, getAnalyticsService } from '@/lib/services';

export function WalletButton() {
  const { connected, publicKey, wallet } = useWallet();
  const { setUser, setLoading, reset } = useUserStore();

  // Auto-load user profile when wallet connects
  useEffect(() => {
    async function loadUserProfile() {
      if (connected && publicKey) {
        setLoading(true);
        try {
          const progressService = getProgressService();
          const profile = await progressService.getUserProfile(publicKey.toBase58());
          setUser(profile as any);

          // Track wallet connection
          const analytics = getAnalyticsService();
          analytics.track('wallet_connected', {
            wallet_type: wallet?.adapter.name || 'unknown',
            user_id: publicKey.toBase58(),
          });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Wallet disconnected
        reset();
      }
    }

    loadUserProfile();
  }, [connected, publicKey, wallet, setUser, setLoading, reset]);

  return <WalletMultiButton />;
}
