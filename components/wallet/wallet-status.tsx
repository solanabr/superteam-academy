'use client';

import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';

export function WalletStatus(): JSX.Element {
  return (
    <div className="wallet-status flex items-center">
      <WalletConnectButton />
    </div>
  );
}
