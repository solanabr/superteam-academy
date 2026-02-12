'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry in production
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="text-6xl">⚡</div>
      <h1 className="text-3xl font-bold">Transaction Failed</h1>
      <p className="max-w-md text-muted-foreground">
        Something went wrong while loading this page. Our validators are looking into it.
      </p>
      {error.digest && (
        <code className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground">
          Error ID: {error.digest}
        </code>
      )}
      <Button variant="solana" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
