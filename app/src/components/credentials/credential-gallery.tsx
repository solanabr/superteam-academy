'use client';

import { ExternalLink, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Credential } from '@/lib/solana/credentials';

interface CredentialGalleryProps {
  credentials: Credential[];
  isLoading: boolean;
  className?: string;
}

const TRACK_GRADIENTS: Record<number, string> = {
  0: 'from-emerald-500 to-teal-600',
  1: 'from-blue-500 to-indigo-600',
  2: 'from-purple-500 to-violet-600',
  3: 'from-orange-500 to-amber-600',
  4: 'from-rose-500 to-pink-600',
};

const LEVEL_LABELS: Record<number, string> = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced',
};

function getTrackGradient(trackId: number | undefined): string {
  if (trackId === undefined) return 'from-zinc-500 to-zinc-600';
  return TRACK_GRADIENTS[trackId % Object.keys(TRACK_GRADIENTS).length] ?? 'from-zinc-500 to-zinc-600';
}

function CredentialCard({ credential }: { credential: Credential }) {
  const tCredentials = useTranslations('credentials');
  const gradient = getTrackGradient(credential.attributes.trackId);
  const level = credential.attributes.level;
  const explorerUrl = `https://explorer.solana.com/address/${credential.assetId}?cluster=devnet`;

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      {/* NFT Image / Gradient placeholder */}
      <div
        className={cn(
          'relative flex aspect-square items-center justify-center bg-gradient-to-br',
          gradient,
        )}
      >
        {credential.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={credential.imageUrl}
            alt={credential.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <Award className="size-12 text-white/80" />
        )}

        {/* Verified badge overlay */}
        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className="bg-background/80 text-[10px] backdrop-blur-sm"
          >
            {tCredentials('verified')}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-medium">{credential.name}</p>

        <div className="flex items-center gap-1.5">
          {level !== undefined && (
            <Badge variant="outline" className="text-[10px]">
              {LEVEL_LABELS[level] ?? `Level ${level}`}
            </Badge>
          )}
          {credential.attributes.totalXp !== undefined && (
            <Badge variant="secondary" className="text-[10px]">
              {credential.attributes.totalXp.toLocaleString()} XP
            </Badge>
          )}
        </div>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          View on Explorer
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

function CredentialSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function CredentialGallery({
  credentials,
  isLoading,
  className,
}: CredentialGalleryProps) {
  const t = useTranslations('dashboard');

  if (isLoading) {
    return (
      <Card className={cn('py-0', className)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">{t('credentials')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <CredentialSkeleton />
            <CredentialSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t('credentials')}</CardTitle>
          {credentials.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {credentials.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
            <Award className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No credentials yet</p>
              <p className="text-xs text-muted-foreground">
                Complete courses to earn on-chain credentials
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {credentials.map((credential) => (
              <CredentialCard
                key={credential.assetId}
                credential={credential}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
