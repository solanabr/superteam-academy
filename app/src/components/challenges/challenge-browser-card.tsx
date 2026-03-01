'use client';

import { useTranslations } from 'next-intl';
import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CodingChallenge } from '@/lib/challenges';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  advanced: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
} as const;

const CATEGORY_ACCENT = {
  'solana-fundamentals': 'border-l-violet-500',
  'defi': 'border-l-emerald-500',
  'nft-metaplex': 'border-l-amber-500',
  'security': 'border-l-rose-500',
  'token-extensions': 'border-l-fuchsia-500',
} as const;

const CATEGORY_BADGE = {
  'solana-fundamentals': 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'defi': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'nft-metaplex': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'security': 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  'token-extensions': 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400',
} as const;

interface ChallengeBrowserCardProps {
  challenge: CodingChallenge;
  className?: string;
}

export function ChallengeBrowserCard({ challenge, className }: ChallengeBrowserCardProps) {
  const t = useTranslations('challenges_page');

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border-l-4 border bg-card p-4 transition-colors hover:bg-accent/50',
        CATEGORY_ACCENT[challenge.category],
        className,
      )}
    >
      {/* Top row: category + difficulty */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className={cn('text-[10px]', CATEGORY_BADGE[challenge.category])}>
          {t(challenge.category.replace('-', '_') as 'solana_fundamentals' | 'defi' | 'nft_metaplex' | 'security' | 'token_extensions')}
        </Badge>
        <Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_STYLES[challenge.difficulty])}>
          {t(challenge.difficulty)}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-tight line-clamp-2">
        {challenge.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {challenge.description}
      </p>

      {/* Bottom row: language, XP, time */}
      <div className="mt-auto flex items-center gap-3 pt-1">
        <Badge variant="outline" className="text-[10px] font-mono">
          {challenge.language === 'rust' ? 'Rust' : 'TypeScript'}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="size-3 text-primary" />
          {challenge.xpReward}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {challenge.estimatedMinutes}m
        </span>
      </div>
    </div>
  );
}
