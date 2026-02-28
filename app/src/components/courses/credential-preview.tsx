'use client';

import { useTranslations } from 'next-intl';
import { Award, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Track styling for the credential mockup
// ---------------------------------------------------------------------------

const CREDENTIAL_ACCENTS: Record<number, { gradient: string; ring: string }> = {
  1: {
    gradient: 'from-purple-500 to-indigo-600',
    ring: 'ring-purple-500/20',
  },
  2: {
    gradient: 'from-blue-500 to-cyan-600',
    ring: 'ring-blue-500/20',
  },
  3: {
    gradient: 'from-pink-500 to-rose-600',
    ring: 'ring-pink-500/20',
  },
  4: {
    gradient: 'from-orange-500 to-amber-600',
    ring: 'ring-orange-500/20',
  },
};

const DEFAULT_ACCENT = {
  gradient: 'from-primary to-accent',
  ring: 'ring-primary/20',
};

const TRACK_NAMES: Record<number, string> = {
  1: 'Solana Core',
  2: 'DeFi',
  3: 'NFT',
  4: 'Security',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CredentialPreviewProps {
  courseName: string;
  trackId: number;
  totalXp: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CredentialPreview({
  courseName,
  trackId,
  totalXp,
}: CredentialPreviewProps) {
  const t = useTranslations('courses');
  const accent = CREDENTIAL_ACCENTS[trackId] ?? DEFAULT_ACCENT;
  const trackName = TRACK_NAMES[trackId] ?? 'General';

  return (
    <Card className="overflow-hidden py-0">
      {/* Card label */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <Award className="text-muted-foreground size-4" />
        <span className="text-sm font-semibold">{t('credential_earned')}</span>
      </div>

      <Separator />

      <CardContent className="flex flex-col items-center gap-4 px-4 py-6">
        {/* NFT mockup */}
        <div
          className={cn(
            'relative flex size-32 items-center justify-center rounded-2xl bg-gradient-to-br ring-4 sm:size-36',
            accent.gradient,
            accent.ring,
          )}
        >
          {/* Inner decoration */}
          <div className="absolute inset-2 rounded-xl border border-white/20" />
          <div className="relative flex flex-col items-center gap-1">
            <Shield className="size-10 text-white/90 sm:size-12" />
            <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
              {trackName}
            </span>
          </div>

          {/* Corner sparkle */}
          <Sparkles className="absolute -top-1.5 -right-1.5 size-5 text-amber-400 drop-shadow-sm" />
        </div>

        {/* Course name */}
        <p className="text-center text-sm font-medium leading-tight">
          {courseName}
        </p>

        {/* Metadata */}
        <div className="bg-muted/50 flex w-full items-center justify-around rounded-lg px-3 py-2.5 text-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t('track_label')}
            </span>
            <span className="text-xs font-semibold">{trackName}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t('xp')}
            </span>
            <span className="text-xs font-semibold tabular-nums">{totalXp}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t('type_label')}
            </span>
            <span className="text-xs font-semibold">Soulbound</span>
          </div>
        </div>

        {/* CTA text */}
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          {t('complete_to_earn')}
        </p>
      </CardContent>
    </Card>
  );
}
