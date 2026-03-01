'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { shortenAddress, formatXp } from '@/lib/utils';
import { calculateLevel } from '@/lib/solana/constants';
import { getLearningProgressService } from '@/lib/services';
import type { LeaderboardEntry, TimeFrame } from '@/types';
import { Trophy, Medal, Crown, Sparkles, Loader2 } from 'lucide-react';

// Demo leaderboard data
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, wallet: 'Dv2r...kX9m', xp: 15200, level: 12, credentialCount: 4 },
  { rank: 2, wallet: 'B4nK...Zp3w', xp: 12800, level: 11, credentialCount: 3 },
  { rank: 3, wallet: 'FhTz...mQ7e', xp: 10500, level: 10, credentialCount: 3 },
  { rank: 4, wallet: '7KxR...Jn2c', xp: 8900, level: 9, credentialCount: 2 },
  { rank: 5, wallet: 'Nq4S...wL8v', xp: 7600, level: 8, credentialCount: 2 },
  { rank: 6, wallet: 'Yz1M...pH5f', xp: 6200, level: 7, credentialCount: 2 },
  { rank: 7, wallet: 'Cb8G...xK4j', xp: 5100, level: 7, credentialCount: 1 },
  { rank: 8, wallet: 'Tj3W...rN9a', xp: 4300, level: 6, credentialCount: 1 },
  { rank: 9, wallet: 'Hm6P...vS2d', xp: 3800, level: 6, credentialCount: 1 },
  { rank: 10, wallet: 'Qw5F...bT1g', xp: 3200, level: 5, credentialCount: 1 },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-xp-gold" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-xp-silver" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-xp-bronze" />;
  return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return 'bg-xp-gold/5 border-xp-gold/20';
  if (rank === 2) return 'bg-xp-silver/5 border-xp-silver/20';
  if (rank === 3) return 'bg-xp-bronze/5 border-xp-bronze/20';
  return '';
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const { publicKey } = useWallet();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [loading, setLoading] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all-time');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const service = getLearningProgressService();
        const data = await service.getLeaderboard(timeFrame);
        if (!cancelled && data.length > 0) {
          setEntries(data);
        }
      } catch {
        // Keep demo data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [timeFrame]);

  return (
    <div className="container py-8 md:py-12">
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-xp-gold" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="all-time" onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
        <TabsList className="mb-6">
          <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
          <TabsTrigger value="all-time">{t('allTime')}</TabsTrigger>
        </TabsList>

        {['weekly', 'monthly', 'all-time'].map((tf) => (
          <TabsContent key={tf} value={tf}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('allTime')} Rankings</CardTitle>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('noEntries')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                      <div className="col-span-1">{t('rank')}</div>
                      <div className="col-span-5">{t('learner')}</div>
                      <div className="col-span-2 text-right">{t('level')}</div>
                      <div className="col-span-2 text-right">{t('xp')}</div>
                      <div className="col-span-2 text-right">{t('credentials')}</div>
                    </div>

                    {entries.map((entry) => {
                      const isCurrentUser =
                        publicKey && entry.wallet === publicKey.toBase58();

                      return (
                        <div
                          key={entry.rank}
                          className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border transition-colors ${
                            isCurrentUser
                              ? 'border-solana-purple/40 bg-solana-purple/5'
                              : getRankBg(entry.rank)
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div className="col-span-5 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-solana-purple/20 to-solana-green/20">
                                {entry.wallet.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-mono text-sm">
                              {entry.wallet.length > 10
                                ? shortenAddress(entry.wallet)
                                : entry.wallet}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="solana" className="text-[10px]">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            <Badge variant="secondary">Lv. {entry.level}</Badge>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="flex items-center justify-end gap-1 font-medium">
                              <Sparkles className="h-3 w-3 text-xp-gold" />
                              {formatXp(entry.xp)}
                            </span>
                          </div>
                          <div className="col-span-2 text-right text-muted-foreground">
                            {entry.credentialCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
