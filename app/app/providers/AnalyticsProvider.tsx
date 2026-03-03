'use client';

/**
 * Analytics provider that wraps the app with GA4 and PostHog.
 * Sentry initializes separately via config files.
 */

import { Suspense } from 'react';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <GoogleAnalytics />
            <PostHogProvider>
                {children}
            </PostHogProvider>
        </Suspense>
    );
}
