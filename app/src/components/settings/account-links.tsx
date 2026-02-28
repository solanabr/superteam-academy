'use client';

import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Chrome, Github, Wallet, Check, Link2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AccountRow {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  detail: string | null;
  onLink: () => void;
}

export function AccountLinks() {
  const { data: session } = useSession();
  const { connected: walletConnected, publicKey } = useWallet();
  const t = useTranslations('settings');

  const isGoogleConnected = session?.provider === 'google';
  const isGithubConnected = session?.provider === 'github';

  const accounts: AccountRow[] = [
    {
      id: 'google',
      label: 'Google',
      icon: Chrome,
      connected: isGoogleConnected,
      detail: isGoogleConnected ? (session?.user?.email ?? null) : null,
      onLink: () => signIn('google'),
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: Github,
      connected: isGithubConnected,
      detail: isGithubConnected ? (session?.user?.name ?? null) : null,
      onLink: () => signIn('github'),
    },
    {
      id: 'wallet',
      label: t('wallet'),
      icon: Wallet,
      connected: walletConnected,
      detail: walletConnected && publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : null,
      onLink: () => {
        // Wallet connection is handled by the wallet adapter button,
        // so we don't trigger anything here. The user should use the
        // wallet button in the header.
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          {t('connected_accounts')}
        </CardTitle>
        <CardDescription>
          {t('connected_accounts_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => {
          const Icon = account.icon;
          return (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{account.label}</p>
                  {account.detail && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {account.detail}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {account.connected ? (
                  <Badge variant="outline" className="gap-1">
                    <Check className="size-3" />
                    {t('linked')}
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={account.onLink}
                    disabled={account.id === 'wallet'}
                  >
                    {t('link')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
