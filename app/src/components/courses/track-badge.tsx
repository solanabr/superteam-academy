'use client';

import {
  Blocks,
  Coins,
  Image,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Track configuration map keyed by trackId.
 * Each track has a display label, icon, and color classes.
 * trackSlug is used as a fallback lookup when trackId is 0 / unknown.
 */
const TRACK_MAP: Record<
  number,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  1: {
    label: 'Solana Core',
    icon: Blocks,
    className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25',
  },
  2: {
    label: 'DeFi',
    icon: Coins,
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25',
  },
  3: {
    label: 'NFT',
    icon: Image,
    className: 'bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/25',
  },
  4: {
    label: 'Security',
    icon: ShieldCheck,
    className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25',
  },
};

const SLUG_TO_TRACK_ID: Record<string, number> = {
  'solana-core': 1,
  defi: 2,
  nft: 3,
  security: 4,
};

const DEFAULT_TRACK = {
  label: 'General',
  icon: GraduationCap,
  className: 'bg-muted text-muted-foreground border-border',
};

interface TrackBadgeProps {
  trackId: number;
  trackSlug?: string;
  className?: string;
}

export function TrackBadge({ trackId, trackSlug, className }: TrackBadgeProps) {
  const resolvedId = trackId || (trackSlug ? SLUG_TO_TRACK_ID[trackSlug] ?? 0 : 0);
  const config = TRACK_MAP[resolvedId] ?? DEFAULT_TRACK;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', config.className, className)}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
