'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import { Wallet, LogOut } from 'lucide-react';

export function ConnectButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const t = useTranslations('common');

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="font-mono text-xs">
          {shortenAddress(publicKey.toBase58())}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          aria-label={t('disconnect')}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="solana"
      onClick={() => setVisible(true)}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {t('connectWallet')}
    </Button>
  );
}
