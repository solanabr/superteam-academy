'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  getCredentialById,
  verifyCredential,
} from '@/lib/solana/credentials';
import type { Credential, VerificationResult } from '@/lib/solana/credentials';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CredentialDetail } from '@/components/credentials/credential-detail';

interface PageProps {
  params: Promise<{ assetId: string }>;
}

function CredentialSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Verification skeleton */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Content skeletons */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Credential Not Found</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="size-3.5" />
          {t('back')} to Dashboard
        </Link>
      </Button>
    </div>
  );
}

export default function CredentialViewerPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { assetId } = resolvedParams;

  const [credential, setCredential] = useState<Credential | null>(null);
  const [verification, setVerification] = useState<VerificationResult | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCredential() {
      setIsLoading(true);
      setError(null);

      try {
        const [cred, verif] = await Promise.all([
          getCredentialById(assetId),
          verifyCredential(assetId),
        ]);

        if (cancelled) return;

        if (!cred) {
          setError(
            'The credential you are looking for does not exist or may have been burned.',
          );
          setCredential(null);
          setVerification(undefined);
        } else {
          setCredential(cred);
          setVerification(verif);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to fetch credential data.';
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCredential();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading && <CredentialSkeleton />}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && credential && (
        <CredentialDetail
          credential={credential}
          verification={verification}
        />
      )}
    </div>
  );
}
