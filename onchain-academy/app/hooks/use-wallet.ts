'use client';

import { usePrivy } from '@privy-io/react-auth';

export function useWallet() {
  const { user, ready, authenticated, login, logout } = usePrivy();
  
  const solanaWallet = user?.wallet;
  const address = solanaWallet?.address;
  
  return {
    user,
    ready,
    authenticated,
    login,
    logout,
    wallet: solanaWallet,
    address,
  };
}
