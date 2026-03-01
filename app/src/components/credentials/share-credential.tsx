'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Copy, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ShareCredentialProps {
  assetId: string;
  credentialName: string;
}

/**
 * Minimalist QR code placeholder: an 8x8 grid pattern rendered as inline SVG.
 * Not a real QR code — purely decorative until a proper encoder is added.
 */
function QrPlaceholder({ size = 120 }: { size?: number }) {
  const cells = 8;
  const cellSize = size / cells;

  // Deterministic pseudo-random pattern
  const pattern = [
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 0, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 0, 1, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-md border bg-white dark:bg-zinc-900"
      aria-hidden="true"
    >
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              className="fill-foreground"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function ShareCredential({
  assetId,
  credentialName,
}: ShareCredentialProps) {
  const t = useTranslations('credentials');
  const [copied, setCopied] = useState(false);

  const credentialUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/credentials/${assetId}`
      : `/credentials/${assetId}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(credentialUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [credentialUrl]);

  const handleShareX = useCallback(() => {
    const text = encodeURIComponent(
      `Check out my Superteam Academy credential: "${credentialName}" \u{1F680}\n\n${credentialUrl}`,
    );
    window.open(
      `https://x.com/intent/tweet?text=${text}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [credentialName, credentialUrl]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Share2 className="size-4" />
          {t('share')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy Link */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('copy_link')}</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={credentialUrl}
              className="text-xs font-mono"
              aria-label="Credential URL"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Share */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={handleShareX}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Share on X
          </Button>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
          <QrPlaceholder />
          <p className="text-xs text-muted-foreground">
            QR code preview
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
