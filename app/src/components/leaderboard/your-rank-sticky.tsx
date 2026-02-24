'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getLevelTitle } from '@/lib/solana/xp';

interface YourRankStickyProps {
  rank: number | null;
  xp: number;
  level: number;
  className?: string;
}

export function YourRankSticky({ rank, xp, level, className }: YourRankStickyProps) {
  const t = useTranslations('leaderboard');
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Show sticky bar only when the sentinel (placed near the top of
  // the leaderboard) is scrolled out of view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsVisible(!entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Don't render anything if user has no rank
  if (rank === null) {
    return <div ref={sentinelRef} className="h-0" aria-hidden />;
  }

  const levelTitle = getLevelTitle(level);

  return (
    <>
      {/* Sentinel element - placed inline in the page flow */}
      <div ref={sentinelRef} className="h-0" aria-hidden />

      {/* Sticky bar */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 transition-all duration-300',
          isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none',
          className,
        )}
      >
        <div className="border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-sm font-semibold">
                {t('your_rank')}:{' '}
                <span className="tabular-nums text-primary">#{rank}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs tabular-nums">
                Lv. {level}
                <span className="ml-1 text-muted-foreground hidden sm:inline">
                  {levelTitle}
                </span>
              </Badge>
              <span className="text-sm font-bold tabular-nums">
                {xp.toLocaleString()}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  {t('xp')}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
