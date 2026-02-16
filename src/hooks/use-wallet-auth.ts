'use client';

import { useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/stores/user-store';
import { analytics } from '@/lib/analytics';
import toast from 'react-hot-toast';

/**
 * Hook that bridges Solana wallet adapter with our user store.
 * Automatically signs in users when they connect their wallet.
 */
export function useWalletAuth() {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { user, setUser, isAuthenticated, signOut, initDemoUser } =
    useUserStore();

  // When wallet connects, create/update user
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated) {
      const walletAddress = publicKey.toBase58();
      const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

      setUser({
        id: walletAddress,
        username: shortAddress.toLowerCase(),
        displayName: shortAddress,
        email: '',
        avatar: '',
        bio: '',
        walletAddress,
        joinedAt: new Date().toISOString(),
        socialLinks: {},
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: true,
        },
        isPublic: true,
      });

      // Track analytics
      analytics.walletConnect(wallet?.adapter.name || 'unknown');
      analytics.signIn('wallet');

      toast.success(`Connected: ${shortAddress}`);
    }
  }, [connected, publicKey, isAuthenticated, setUser, wallet]);

  // When wallet disconnects
  useEffect(() => {
    if (!connected && isAuthenticated && user?.walletAddress) {
      signOut();
    }
  }, [connected, isAuthenticated, user, signOut]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      signOut();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [disconnect, signOut]);

  return {
    isWalletConnected: connected,
    walletAddress: publicKey?.toBase58(),
    handleDisconnect,
  };
}
