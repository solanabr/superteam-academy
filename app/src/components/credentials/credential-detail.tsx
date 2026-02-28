'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Award,
  ExternalLink,
  Copy,
  Check,
  User,
  Layers,
  Download,
} from 'lucide-react';
import { generateCertificateImage } from '@/lib/utils/generate-certificate';
import { cn } from '@/lib/utils';
import { CLUSTER } from '@/lib/solana/constants';
import type { Credential, VerificationResult } from '@/lib/solana/credentials';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VerificationBadge } from '@/components/credentials/verification-badge';
import { CredentialAttributes } from '@/components/credentials/credential-attributes';
import { ShareCredential } from '@/components/credentials/share-credential';

const TRACK_GRADIENTS: Record<number, string> = {
  0: 'from-emerald-500 to-teal-600',
  1: 'from-blue-500 to-indigo-600',
  2: 'from-purple-500 to-violet-600',
  3: 'from-orange-500 to-amber-600',
  4: 'from-rose-500 to-pink-600',
};

function getTrackGradient(trackId: number | undefined): string {
  if (trackId === undefined) return 'from-zinc-500 to-zinc-600';
  return (
    TRACK_GRADIENTS[trackId % Object.keys(TRACK_GRADIENTS).length] ??
    'from-zinc-500 to-zinc-600'
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}\u2026${address.slice(-6)}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

interface CredentialDetailProps {
  credential: Credential;
  verification?: VerificationResult;
}

export function CredentialDetail({
  credential,
  verification,
}: CredentialDetailProps) {
  const t = useTranslations('credentials');
  const [ownerCopied, setOwnerCopied] = useState(false);
  const gradient = getTrackGradient(credential.attributes.trackId);
  const explorerUrl = `https://explorer.solana.com/address/${credential.assetId}?cluster=${CLUSTER}`;

  const handleDownloadCertificate = useCallback(() => {
    generateCertificateImage({
      courseName: credential.name || 'Superteam Academy Credential',
      recipientWallet: credential.owner,
      issueDate: credential.createdAt ?? new Date().toISOString(),
      trackId: credential.attributes.trackId,
    });
  }, [credential]);

  const handleCopyOwner = useCallback(async () => {
    if (!credential.owner) return;
    try {
      await navigator.clipboard.writeText(credential.owner);
      setOwnerCopied(true);
      setTimeout(() => setOwnerCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [credential.owner]);

  return (
    <div className="space-y-6">
      {/* Hero: NFT Image */}
      <div className="overflow-hidden rounded-2xl border shadow-lg">
        <div
          className={cn(
            'relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br sm:aspect-[16/9]',
            gradient,
          )}
        >
          {credential.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={credential.imageUrl}
              alt={credential.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Award className="size-16" />
              <span className="text-sm font-medium tracking-wide uppercase opacity-60">
                Credential NFT
              </span>
            </div>
          )}

          {/* Frozen badge overlay */}
          {credential.frozen && (
            <div className="absolute left-3 top-3">
              <Badge className="bg-background/80 text-[10px] backdrop-blur-sm">
                Soulbound
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Title + Meta */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {credential.name || 'Untitled Credential'}
        </h1>
        {credential.createdAt && (
          <p className="text-sm text-muted-foreground">
            Issued {formatDate(credential.createdAt)}
          </p>
        )}
      </div>

      {/* Verification Badge */}
      {verification && <VerificationBadge verification={verification} />}

      <Separator />

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Details */}
        <div className="space-y-6">
          {/* Attributes Table */}
          <CredentialAttributes
            attributes={credential.attributes}
            createdAt={credential.createdAt}
          />

          {/* Owner */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="size-4" />
              {t('owner')}
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <code className="flex-1 truncate text-sm font-mono">
                {truncateAddress(credential.owner)}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopyOwner}
                aria-label="Copy owner address"
              >
                {ownerCopied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Collection */}
          {credential.collection && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="size-4" />
                {t('collection')}
              </p>
              <div className="rounded-lg border bg-muted/30 p-3">
                <code className="text-sm font-mono text-muted-foreground">
                  {truncateAddress(credential.collection)}
                </code>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                View on Solana Explorer
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownloadCertificate}
            >
              <Download className="size-3.5" />
              {t('download_certificate')}
            </Button>
          </div>
        </div>

        {/* Right: Share */}
        <div className="space-y-6">
          <ShareCredential
            assetId={credential.assetId}
            credentialName={credential.name}
          />
        </div>
      </div>
    </div>
  );
}
