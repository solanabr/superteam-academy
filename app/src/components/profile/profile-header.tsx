'use client';

import { useCallback, useMemo, useState } from 'react';
import { Calendar, Copy, Check, ExternalLink, Globe } from 'lucide-react';
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

interface SocialLinks {
  twitter: string;
  github: string;
  website: string;
}

interface ProfileHeaderProps {
  wallet: string;
  xp: number;
  level: number;
  levelTitle: string;
  xpProgress: number;
  streak: number;
  coursesCompleted: number;
  bio?: string;
  socialLinks?: SocialLinks;
  joinDate?: string;
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

function formatJoinDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Twitter/X brand icon (simple path) */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** GitHub brand icon */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
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
  bio,
  socialLinks,
  joinDate,
  isLoading = false,
  className,
}: ProfileHeaderProps) {
  const t = useTranslations('gamification');
  const tProfile = useTranslations('profile');
  const [copied, setCopied] = useState(false);

  const gradient = useMemo(() => walletToGradient(wallet), [wallet]);
  const nextLevelXp = xpForLevel(level + 1);
  const explorerUrl = `https://explorer.solana.com/address/${wallet}?cluster=devnet`;

  const formattedJoinDate = useMemo(
    () => (joinDate ? formatJoinDate(joinDate) : ''),
    [joinDate],
  );

  const hasSocialLinks =
    socialLinks &&
    (socialLinks.twitter || socialLinks.github || socialLinks.website);

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

            {/* Bio */}
            {bio && (
              <p className="text-sm text-muted-foreground max-w-md">
                {bio}
              </p>
            )}

            {/* Social Links + Join Date row */}
            {(hasSocialLinks || formattedJoinDate) && (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {socialLinks?.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Twitter / X"
                  >
                    <TwitterIcon className="size-3.5" />
                  </a>
                )}
                {socialLinks?.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    aria-label="GitHub"
                  >
                    <GitHubIcon className="size-3.5" />
                  </a>
                )}
                {socialLinks?.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Website"
                  >
                    <Globe className="size-3.5" />
                  </a>
                )}
                {formattedJoinDate && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {tProfile('joined', { date: formattedJoinDate })}
                  </span>
                )}
              </div>
            )}

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
