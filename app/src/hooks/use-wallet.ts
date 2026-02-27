'use client';

import { useAuth } from '@/components/providers/auth-provider';

/**
 * useWallet hook
 *
 * Provides wallet connectivity state and actions.
 * Uses the AuthProvider for authentication integration.
 */
export function useWallet() {
  const {
    user,
    isAuthenticated,
    walletConnected,
    walletConnecting,
    connectWallet,
    disconnectWallet,
    signInWithWallet,
    signOutUser,
  } = useAuth();

  return {
    // Core wallet state
    connected: walletConnected,
    publicKey: user?.walletAddress || null,
    address: user?.walletAddress || null,
    connecting: walletConnecting,

    // Auth-aware wallet actions
    connect: signInWithWallet, // Sign in with wallet (creates session)
    disconnect: signOutUser, // Sign out (ends session)

    // Direct wallet interaction (no session)
    connectWalletOnly: connectWallet,
    disconnectWalletOnly: disconnectWallet,

    // Auth state
    isAuthenticated,
    user,
  };
}
