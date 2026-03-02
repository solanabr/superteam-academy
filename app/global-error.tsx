'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body className="bg-background text-foreground">
        <div className="container flex min-h-screen flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
          <p className="max-w-xl text-muted-foreground">
            An unexpected error occurred while rendering this page.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-10 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </button>
            <Link
              href="/en"
              className="inline-flex h-10 items-center rounded-xl border border-border px-5 font-semibold hover:bg-muted/40"
            >
              Go Home
            </Link>
            <Link
              href="/en/docs"
              className="inline-flex h-10 items-center rounded-xl border border-border px-5 font-semibold hover:bg-muted/40"
            >
              View Docs
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
