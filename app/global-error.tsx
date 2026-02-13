'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { defaultLocale, dictionaries } from '@/lib/i18n/messages';
import { Locale } from '@/lib/types';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch {
      // Avoid cascading failures inside the error boundary.
    }
  }, [error]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('superteam.locale');
      if (stored === 'pt-BR' || stored === 'es' || stored === 'en') {
        setLocale(stored);
      }
    } catch {
      // Ignore storage read failures and keep default locale.
    }
  }, []);

  const dictionary = dictionaries[locale];

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-border/80 bg-card/70 p-6">
          <h2 className="text-xl font-bold">{dictionary.error.title}</h2>
          <p className="text-sm text-foreground/75">{dictionary.error.description}</p>
          {process.env.NODE_ENV !== 'production' && error.message ? (
            <p className="rounded-xl border border-border/70 bg-background/60 p-2 font-mono text-xs text-foreground/80">
              {error.message}
            </p>
          ) : null}
          {error.digest ? (
            <p className="font-mono text-xs text-foreground/60">
              {dictionary.error.digestPrefix}: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {dictionary.error.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
