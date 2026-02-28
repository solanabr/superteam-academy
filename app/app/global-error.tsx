'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-gray-100 flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-400 mb-6">An unexpected error occurred. Our team has been notified.</p>
          <button
            onClick={() => reset()}
            className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white hover:bg-purple-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
