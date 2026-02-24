'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { LeaderboardRow } from '@/components/leaderboard/leaderboard-row';
import type { LeaderboardEntry } from '@/lib/hooks/use-leaderboard';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentWallet?: string;
  isLoading: boolean;
  className?: string;
}

const PAGE_SIZE = 50;

function RowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-16 text-center">
        <Skeleton className="mx-auto h-5 w-6" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-4 w-20" />
      </TableCell>
    </TableRow>
  );
}

export function LeaderboardTable({
  entries,
  currentWallet,
  isLoading,
  className,
}: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleEntries = useMemo(
    () => entries.slice(0, visibleCount),
    [entries, visibleCount],
  );

  const hasMore = entries.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card overflow-x-auto', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">{t('rank')}</TableHead>
              <TableHead>{t('wallet')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('level')}</TableHead>
              <TableHead className="text-right">{t('xp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">{t('rank')}</TableHead>
              <TableHead>{t('wallet')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('level')}</TableHead>
              <TableHead className="text-right">{t('xp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleEntries.map((entry) => (
              <LeaderboardRow
                key={entry.wallet}
                entry={entry}
                isCurrentUser={entry.wallet === currentWallet}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
          >
            Load More ({entries.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
