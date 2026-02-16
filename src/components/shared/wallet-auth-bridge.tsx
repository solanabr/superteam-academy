'use client';

import { useWalletAuth } from '@/hooks/use-wallet-auth';

/**
 * Bridge component that connects wallet adapter state to user store.
 * Must be rendered inside WalletProvider.
 */
export function WalletAuthBridge() {
  useWalletAuth();
  return null;
}
