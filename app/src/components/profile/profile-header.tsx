'use client';

import { useCallback, useMemo, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LevelBadge } from '@/components/gamification/level-badge';
import { xpForLevel } from '@/lib/solana/xp';

interface ProfileHeaderProps {
  wallet: string;
  xp: number;
  level: number;
  levelTitle: string;
  xpProgress: number;
  streak: number;
  coursesCompleted: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Deterministic gradient from a wallet address.
 * Hashes the first 8 chars into HSL hue values
 * for a two-stop gradient that acts as a Jazzicon avatar.
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

function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="space-y-2">
            <Skeleton className="mx-auto h-5 w-40 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-24 sm:mx-0" />
          </div>
          <Skeleton className="h-3 w-full max-w-xs" />
          <div className="flex flex-wrap justify-center gap-6 sm:justify-start">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileHeader({
  wallet,
  xp,
  level,
  levelTitle,
  xpProgress,
  streak,
  coursesCompleted,
  isLoading = false,
  className,
}: ProfileHeaderProps) {
  const t = useTranslations('gamification');
  const tProfile = useTranslations('profile');
  const [copied, setCopied] = useState(false);

  const gradient = useMemo(() => walletToGradient(wallet), [wallet]);
  const nextLevelXp = xpForLevel(level + 1);
  const explorerUrl = `https://explorer.solana.com/address/${wallet}?cluster=devnet`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [wallet]);

  if (isLoading) {
    return <ProfileHeaderSkeleton className={className} />;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card',
        className,
      )}
    >
      {/* Decorative gradient top stripe */}
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-15"
        style={{ background: gradient }}
      />

      <div className="relative p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ring-4 ring-background"
            style={{ background: gradient }}
            role="img"
            aria-label={`Avatar for ${truncateWallet(wallet)}`}
          >
            {wallet.slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4 text-center sm:text-left">
            {/* Wallet + copy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 font-mono text-base font-semibold transition-colors hover:text-primary"
                    >
                      {truncateWallet(wallet)}
                      {copied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Copy wallet address'}
                  </TooltipContent>
                </Tooltip>

                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <ExternalLink className="size-3" />
                  Explorer
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <LevelBadge level={level} title={levelTitle} size="sm" />
              </div>
            </div>

            {/* XP Progress bar */}
            <div className="max-w-sm space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{xp.toLocaleString()} {t('xp')}</span>
                <span>{nextLevelXp.toLocaleString()} {t('xp')}</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
              <StatPill label={t('xp')} value={xp.toLocaleString()} />
              <StatPill label={t('level')} value={level.toString()} />
              <StatPill label={t('streak')} value={`${streak}d`} />
              <StatPill
                label={tProfile('completed_courses')}
                value={coursesCompleted.toString()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
        {label}
      </span>
    </div>
  );
}
