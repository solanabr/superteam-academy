'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog } from '@/lib/analytics/posthog';
import { pageView } from '@/lib/analytics';

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize PostHog on first load
    useEffect(() => {
        initPostHog();
    }, []);

    // Track page views on route change
    useEffect(() => {
        if (pathname) {
            let url = pathname;
            if (searchParams && searchParams.toString()) {
                url += `?${searchParams.toString()}`;
            }
            pageView(url);
        }
    }, [pathname, searchParams]);

    return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}>
                <AnalyticsTracker />
            </Suspense>
            {children}
        </>
    );
}
