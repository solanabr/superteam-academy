'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StreakCounter } from '@/components/gamification/streak-counter';

interface WelcomeBannerProps {
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
  className?: string;
}

function truncateWallet(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WelcomeBanner({
  level,
  levelTitle,
  currentStreak,
  longestStreak,
  isLoading,
  className,
}: WelcomeBannerProps) {
  const { publicKey } = useWallet();
  const t = useTranslations('dashboard');
  const tGamification = useTranslations('gamification');

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6',
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6',
        'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5',
        'dark:from-primary/10 dark:via-primary/5 dark:to-primary/10',
        className,
      )}
    >
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9ImN1cnJlbnRDb2xvciIgb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIi8+PC9zdmc+')] opacity-50" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {publicKey ? (
              <>
                {t('welcome')},{' '}
                <span className="text-primary">
                  {truncateWallet(publicKey.toBase58())}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Wallet className="size-5" />
                Connect wallet to start
              </span>
            )}
          </h1>

          {publicKey && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {tGamification('level')} {level} &middot; {levelTitle}
              </Badge>
            </div>
          )}
        </div>

        {publicKey && (
          <StreakCounter
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        )}
      </div>
    </div>
  );
}
