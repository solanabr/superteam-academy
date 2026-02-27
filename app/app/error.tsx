'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:px-6" tabIndex={-1}>
        <div className="mx-auto max-w-md rounded-xl border border-border/50 bg-surface p-8 text-center">
          <h1 className="text-title font-semibold text-[rgb(var(--text))]">Something went wrong</h1>
          <p className="text-body mt-2 text-[rgb(var(--text-muted))]">
            We encountered an error. You can try again or go back to the home page.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-accent px-4 py-2 text-caption font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
