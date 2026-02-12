'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA4, initPostHog, initSentry, trackPageView } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize on mount
  useEffect(() => {
    initGA4(process.env.NEXT_PUBLIC_GA_ID);
    initPostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY);
    initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }, []);

  // Track page views
  const pathname = usePathname();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
