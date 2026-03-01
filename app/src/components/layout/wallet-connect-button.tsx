'use client';

import { useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
} from 'lucide-react';
import { CLUSTER } from '@/lib/solana/constants';

function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface WalletConnectButtonProps {
  className?: string;
  fullWidth?: boolean;
}

export function WalletConnectButton({ className, fullWidth }: WalletConnectButtonProps) {
  const t = useTranslations('common');
  const { publicKey, connected, connecting, disconnect, select, wallets, wallet } = useWallet();

  const walletAddress = publicKey?.toBase58() ?? '';

  const detectedWallets = useMemo(
    () => wallets.filter((w) => w.readyState === 'Installed'),
    [wallets],
  );

  const handleSelect = useCallback(
    (walletName: string) => {
      const found = wallets.find((w) => w.adapter.name === walletName);
      if (found) {
        select(found.adapter.name);
      }
    },
    [wallets, select],
  );

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied');
    } catch {
      /* clipboard not available */
    }
  }, [walletAddress]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch {
      /* ignore */
    }
  }, [disconnect]);

  const explorerUrl = `https://explorer.solana.com/address/${walletAddress}?cluster=${CLUSTER}`;

  // Connected state — show address dropdown
  if (connected && publicKey) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
          >
            <Wallet className="h-4 w-4" />
            {truncateAddress(walletAddress)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            {wallet?.adapter.name ?? 'Wallet'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopy} className="gap-2">
            <Copy className="h-3.5 w-3.5" />
            Copy address
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2">
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="gap-2 text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // No wallets detected — prompt to install
  if (detectedWallets.length === 0) {
    return (
      <Button
        size="sm"
        className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
        onClick={() => window.open('https://phantom.app', '_blank')}
      >
        <Wallet className="h-4 w-4" />
        {t('connect_wallet')}
      </Button>
    );
  }

  // Single wallet detected — connect directly
  if (detectedWallets.length === 1) {
    return (
      <Button
        size="sm"
        className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
        disabled={connecting}
        onClick={() => handleSelect(detectedWallets[0]!.adapter.name)}
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : t('connect_wallet')}
      </Button>
    );
  }

  // Multiple wallets — show selection dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
          disabled={connecting}
        >
          <Wallet className="h-4 w-4" />
          {connecting ? 'Connecting...' : t('connect_wallet')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">
          Select Wallet
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {detectedWallets.map((w) => (
          <DropdownMenuItem
            key={w.adapter.name}
            onClick={() => handleSelect(w.adapter.name)}
            className="gap-2"
          >
            {w.adapter.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
