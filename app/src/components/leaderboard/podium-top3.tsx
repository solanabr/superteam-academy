'use client';

import { useMemo } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getLevelTitle } from '@/lib/solana/xp';
import type { LeaderboardEntry } from '@/lib/hooks/use-leaderboard';

interface PodiumTop3Props {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Deterministic avatar gradient from wallet hash.
 */
function walletToGradient(wallet: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(wallet.length, 12); i++) {
    hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 45 + Math.abs((hash >> 8) % 90)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 65%, 45%))`;
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

const PODIUM_CONFIG = {
  1: {
    height: 'h-28 sm:h-32',
    avatarSize: 'size-16 sm:size-20',
    avatarText: 'text-xl sm:text-2xl',
    ringColor: 'ring-yellow-400',
    bgGradient: 'from-yellow-400/20 via-amber-300/10 to-transparent',
    borderColor: 'border-yellow-400/40',
    icon: Crown,
    iconColor: 'text-yellow-400',
    iconSize: 'size-6',
    label: '1st',
    labelColor: 'text-yellow-500 dark:text-yellow-400',
    orderClass: 'order-1 sm:order-2',
  },
  2: {
    height: 'h-20 sm:h-24',
    avatarSize: 'size-12 sm:size-16',
    avatarText: 'text-base sm:text-lg',
    ringColor: 'ring-zinc-400',
    bgGradient: 'from-zinc-400/15 via-zinc-300/5 to-transparent',
    borderColor: 'border-zinc-400/30',
    icon: Medal,
    iconColor: 'text-zinc-400',
    iconSize: 'size-5',
    label: '2nd',
    labelColor: 'text-zinc-500 dark:text-zinc-400',
    orderClass: 'order-2 sm:order-1',
  },
  3: {
    height: 'h-16 sm:h-20',
    avatarSize: 'size-12 sm:size-16',
    avatarText: 'text-base sm:text-lg',
    ringColor: 'ring-amber-700 dark:ring-amber-600',
    bgGradient: 'from-amber-700/15 via-amber-600/5 to-transparent',
    borderColor: 'border-amber-700/30 dark:border-amber-600/30',
    icon: Medal,
    iconColor: 'text-amber-700 dark:text-amber-600',
    iconSize: 'size-5',
    label: '3rd',
    labelColor: 'text-amber-700 dark:text-amber-600',
    orderClass: 'order-3 sm:order-3',
  },
} as const;

interface PodiumCardProps {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}

function PodiumCard({ entry, rank }: PodiumCardProps) {
  const config = PODIUM_CONFIG[rank];
  const Icon = config.icon;
  const gradient = useMemo(() => walletToGradient(entry.wallet), [entry.wallet]);
  const levelTitle = useMemo(() => getLevelTitle(entry.level), [entry.level]);

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center gap-3',
        config.orderClass,
      )}
    >
      {/* Rank icon above avatar */}
      <Icon
        className={cn(config.iconSize, config.iconColor)}
        fill="currentColor"
      />

      {/* Avatar */}
      <Link
        href={`/profile/${entry.wallet}`}
        className="group relative"
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-bold text-white ring-4 transition-transform group-hover:scale-105',
            config.avatarSize,
            config.avatarText,
            config.ringColor,
          )}
          style={{ background: gradient }}
        >
          {entry.wallet.slice(0, 2).toUpperCase()}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col items-center gap-1 text-center">
        <Link
          href={`/profile/${entry.wallet}`}
          className="font-mono text-xs font-semibold transition-colors hover:text-primary sm:text-sm"
        >
          {truncateWallet(entry.wallet)}
        </Link>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] tabular-nums">
            Lv. {entry.level}
          </Badge>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {levelTitle}
          </span>
        </div>
        <p className={cn('text-lg font-bold tabular-nums', config.labelColor)}>
          {entry.xpBalance.toLocaleString()}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            XP
          </span>
        </p>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          'w-full rounded-t-xl border-x border-t bg-gradient-to-t',
          config.height,
          config.bgGradient,
          config.borderColor,
        )}
      />
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="flex w-full items-end justify-center gap-4 px-4">
      {/* 2nd place skeleton */}
      <div className="flex flex-1 flex-col items-center gap-3">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-20 w-full rounded-t-xl" />
      </div>
      {/* 1st place skeleton */}
      <div className="flex flex-1 flex-col items-center gap-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-28 w-full rounded-t-xl" />
      </div>
      {/* 3rd place skeleton */}
      <div className="flex flex-1 flex-col items-center gap-3">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-16 w-full rounded-t-xl" />
      </div>
    </div>
  );
}

export function PodiumTop3({ entries, isLoading = false, className }: PodiumTop3Props) {
  if (isLoading) {
    return <PodiumSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center', className)}>
        <Trophy className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No rankings yet. Be the first to earn XP!
        </p>
      </div>
    );
  }

  // Ensure we display in 2nd-1st-3rd order on desktop
  // On mobile we stack 1st-2nd-3rd
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <div className={cn('flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:justify-center sm:gap-4 px-4', className)}>
      {first && <PodiumCard entry={first} rank={1} />}
      {second && <PodiumCard entry={second} rank={2} />}
      {third && <PodiumCard entry={third} rank={3} />}
    </div>
  );
}
