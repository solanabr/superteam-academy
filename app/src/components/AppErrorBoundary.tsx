"use client";

import * as Sentry from "@sentry/nextjs";

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return <>{children}</>;
  }

  return (
    <Sentry.ErrorBoundary fallback={<p className="p-4 text-sm text-red-600">Something went wrong.</p>}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
