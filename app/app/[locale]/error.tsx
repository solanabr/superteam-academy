'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('error')}</h2>
        <p className="max-w-md text-gray-400">
          {error.message || 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500"
        >
          <RefreshCw className="h-4 w-4" />
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
