'use client';

import { useMemo } from 'react';
import { Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { getLevelTitle } from '@/lib/solana/xp';
import type { LeaderboardEntry } from '@/lib/hooks/use-leaderboard';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

/**
 * Deterministic gradient from wallet address for mini-avatar.
 */
function walletToHsl(wallet: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(wallet.length, 12); i++) {
    hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-zinc-400',
  3: 'text-amber-700 dark:text-amber-600',
};

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const avatarColor = useMemo(() => walletToHsl(entry.wallet), [entry.wallet]);
  const levelTitle = useMemo(() => getLevelTitle(entry.level), [entry.level]);
  const medalColor = MEDAL_COLORS[entry.rank];

  return (
    <TableRow
      className={cn(
        isCurrentUser && 'bg-primary/5 dark:bg-primary/10 border-primary/20',
      )}
    >
      {/* Rank */}
      <TableCell className="w-16 text-center font-bold tabular-nums">
        {medalColor ? (
          <div className="flex items-center justify-center">
            <Medal className={cn('size-5', medalColor)} fill="currentColor" />
          </div>
        ) : (
          <span className="text-muted-foreground">{entry.rank}</span>
        )}
      </TableCell>

      {/* Wallet + Avatar */}
      <TableCell>
        <Link
          href={`/profile/${entry.wallet}`}
          className="inline-flex items-center gap-2.5 transition-colors hover:text-primary"
        >
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {entry.wallet.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-mono text-sm">
            {truncateWallet(entry.wallet)}
          </span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              You
            </Badge>
          )}
        </Link>
      </TableCell>

      {/* Level */}
      <TableCell className="hidden sm:table-cell">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] tabular-nums">
            Lv. {entry.level}
          </Badge>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {levelTitle}
          </span>
        </div>
      </TableCell>

      {/* XP */}
      <TableCell className="text-right font-bold tabular-nums">
        {entry.xpBalance.toLocaleString()}
        <span className="ml-1 text-xs font-normal text-muted-foreground">XP</span>
      </TableCell>
    </TableRow>
  );
}
