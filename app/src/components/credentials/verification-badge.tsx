'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationResult } from '@/lib/solana/credentials';
import { Badge } from '@/components/ui/badge';

interface VerificationBadgeProps {
  verification: VerificationResult;
}

export function VerificationBadge({ verification }: VerificationBadgeProps) {
  const t = useTranslations('credentials');
  const [animated, setAnimated] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (verification.valid) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-all duration-500',
          animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        )}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 transition-transform duration-700',
            animated && 'scale-100',
            !animated && 'scale-0',
          )}
        >
          <ShieldCheck
            className={cn(
              'size-5 text-emerald-500 transition-all duration-500',
              animated && 'rotate-0 opacity-100',
              !animated && '-rotate-45 opacity-0',
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {t('verified')} on Solana
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              On-Chain
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This credential is verified as a soulbound NFT on the Solana blockchain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="size-5 text-destructive" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-destructive">
          Unverified
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This credential could not be verified on the Solana blockchain. It may
          have been burned or does not exist.
        </p>
      </div>
    </div>
  );
}
