'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Coins,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLUSTER } from '@/lib/solana/constants';
import { useXp } from '@/lib/hooks/use-xp';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}\u2026${address.slice(-6)}`;
}

export function WalletSettings() {
  const t = useTranslations('settings');
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { xp, level, levelTitle, isLoading: xpLoading } = useXp();
  const [copied, setCopied] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? '';
  const explorerUrl = `https://explorer.solana.com/address/${walletAddress}?cluster=${CLUSTER}`;

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  }, [walletAddress]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch {
      // Disconnect failed
    }
  }, [disconnect]);

  if (!connected || !publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            {t('wallet')}
          </CardTitle>
          <CardDescription>
            Connect your wallet to view wallet details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
            <Wallet className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No wallet connected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5" />
          {t('wallet')}
        </CardTitle>
        <CardDescription>
          Manage your connected wallet and view balances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Wallet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Connected Wallet
            </span>
            {wallet?.adapter.name && (
              <Badge variant="secondary" className="text-[10px]">
                {wallet.adapter.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
            <code className="flex-1 truncate text-sm font-mono">
              {truncateAddress(walletAddress)}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              aria-label="Copy wallet address"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Network
          </span>
          <Badge
            variant={CLUSTER === 'mainnet-beta' ? 'default' : 'outline'}
            className={cn(
              'capitalize',
              CLUSTER === 'devnet' && 'border-amber-500/50 text-amber-600 dark:text-amber-400',
            )}
          >
            {CLUSTER}
          </Badge>
        </div>

        <Separator />

        {/* Balances */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground">
            Balances
          </span>

          {/* SOL Balance — placeholder */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-muted p-1.5">
                <Coins className="size-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">SOL</span>
            </div>
            <span className="text-sm font-mono text-muted-foreground">
              --
            </span>
          </div>

          {/* XP Balance */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium">XP</span>
                {!xpLoading && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {levelTitle} (Lvl {level})
                  </span>
                )}
              </div>
            </div>
            {xpLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="text-sm font-mono font-medium">
                {xp.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            asChild
          >
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              View on Explorer
            </a>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 gap-2"
            onClick={handleDisconnect}
          >
            <Wallet className="size-3.5" />
            Disconnect Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
