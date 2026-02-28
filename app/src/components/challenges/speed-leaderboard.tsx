'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Trophy, Timer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SpeedEntry {
  rank: number;
  wallet: string;
  timeSeconds: number;
  testsPassed: number;
  totalTests: number;
}

const MOCK_SPEED_ENTRIES: SpeedEntry[] = [
  { rank: 1, wallet: '7xKXt...4mPn', timeSeconds: 142, testsPassed: 5, totalTests: 5 },
  { rank: 2, wallet: 'Bq9Rf...8vJk', timeSeconds: 198, testsPassed: 5, totalTests: 5 },
  { rank: 3, wallet: '3nPwQ...6aLm', timeSeconds: 245, testsPassed: 5, totalTests: 5 },
  { rank: 4, wallet: 'DfR2x...9wNc', timeSeconds: 312, testsPassed: 4, totalTests: 5 },
  { rank: 5, wallet: '8mKjY...1bQr', timeSeconds: 367, testsPassed: 4, totalTests: 5 },
  { rank: 6, wallet: 'Hs5Tv...7xGe', timeSeconds: 421, testsPassed: 4, totalTests: 5 },
  { rank: 7, wallet: '2wNfA...3yPk', timeSeconds: 489, testsPassed: 3, totalTests: 5 },
  { rank: 8, wallet: 'Lp7Rc...5dVs', timeSeconds: 534, testsPassed: 3, totalTests: 5 },
  { rank: 9, wallet: '9vBjH...2nXw', timeSeconds: 612, testsPassed: 3, totalTests: 5 },
  { rank: 10, wallet: 'Ct4Wm...6fRa', timeSeconds: 698, testsPassed: 2, totalTests: 5 },
];

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-slate-400',
  3: 'text-amber-700 dark:text-amber-600',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SpeedLeaderboardProps {
  className?: string;
}

export function SpeedLeaderboard({ className }: SpeedLeaderboardProps) {
  const { publicKey } = useWallet();

  // Simulate the current user being rank 5 for highlighting
  const currentWalletTruncated = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 5)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <CardTitle className="text-base">Speed Leaderboard</CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">Today</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Table header */}
        <div className="flex items-center gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-8">#</span>
          <span className="flex-1">Wallet</span>
          <span className="flex w-16 items-center justify-end gap-1">
            <Timer className="size-3" />
            Time
          </span>
          <span className="flex w-20 items-center justify-end gap-1">
            <CheckCircle2 className="size-3" />
            Tests
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {MOCK_SPEED_ENTRIES.map((entry) => {
            const isCurrentUser =
              currentWalletTruncated !== null &&
              entry.wallet === currentWalletTruncated;

            return (
              <div
                key={entry.rank}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isCurrentUser
                    ? 'bg-primary/10 ring-1 ring-primary/20'
                    : 'hover:bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'w-8 font-semibold tabular-nums',
                    RANK_STYLES[entry.rank] ?? 'text-muted-foreground',
                  )}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 truncate font-mono text-xs">
                  {entry.wallet}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] font-medium text-primary">
                      (you)
                    </span>
                  )}
                </span>
                <span className="w-16 text-right font-mono text-xs tabular-nums">
                  {formatTime(entry.timeSeconds)}
                </span>
                <span className="w-20 text-right text-xs">
                  <span className="font-medium">{entry.testsPassed}</span>
                  <span className="text-muted-foreground">/{entry.totalTests}</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
