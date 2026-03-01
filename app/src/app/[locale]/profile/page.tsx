'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LevelProgress } from '@/components/gamification/level-progress';
import { StreakCalendar } from '@/components/gamification/streak-display';
import { fetchXpBalance, calculateLevel } from '@/lib/solana';
import { fetchCredentials } from '@/lib/solana/credentials';
import { StreakService } from '@/lib/services/streak';
import { shortenAddress, formatXp } from '@/lib/utils';
import type { Credential, StreakData } from '@/types';
import {
  User,
  Sparkles,
  Flame,
  BookOpen,
  Award,
  Shield,
  Wallet,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tw = useTranslations('wallet');
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [xp, setXp] = useState(0);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    fetchXpBalance(connection, publicKey).then(setXp);
    fetchCredentials(publicKey.toBase58()).then(setCredentials);
    setStreak(StreakService.getStreak(publicKey.toBase58()));
  }, [publicKey, connection]);

  if (!connected) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-solana-purple" />
            <h2 className="text-xl font-semibold">{tw('connectTitle')}</h2>
            <p className="text-muted-foreground">{tw('connectDesc')}</p>
            <Button variant="solana" onClick={() => setVisible(true)}>
              {tc('connectWallet')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const level = calculateLevel(xp);

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-solana-purple to-solana-green flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1 flex-1">
            <h1 className="text-2xl font-bold">
              {publicKey ? shortenAddress(publicKey.toBase58(), 6) : ''}
            </h1>
            <p className="text-muted-foreground">
              {t('level', { level })}
            </p>
            {publicKey && (
              <a
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-solana-purple hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Sparkles,
              label: t('totalXp'),
              value: formatXp(xp),
              color: 'text-xp-gold',
            },
            {
              icon: Flame,
              label: t('streak'),
              value: `${streak?.currentStreak || 0}`,
              color: 'text-orange-500',
            },
            {
              icon: Award,
              label: t('credentials'),
              value: credentials.length.toString(),
              color: 'text-solana-purple',
            },
            {
              icon: Shield,
              label: t('longestStreak'),
              value: `${streak?.longestStreak || 0}`,
              color: 'text-solana-green',
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6 text-center space-y-2">
                <stat.icon className={`h-6 w-6 mx-auto ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <LevelProgress xp={xp} />
          </CardContent>
        </Card>

        {/* Activity calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCalendar />
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-solana-purple" />
              {t('credentials')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credentials.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('noCredentials')}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {credentials.map((cred) => (
                  <Card key={cred.assetAddress} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-solana-purple/20 to-solana-green/20 flex items-center justify-center">
                      <Shield className="h-12 w-12 text-solana-purple/50" />
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <p className="font-medium text-sm truncate">{cred.name}</p>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-xp-gold" />
                        <span className="text-xs text-muted-foreground">
                          {formatXp(cred.totalXp)} XP
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
