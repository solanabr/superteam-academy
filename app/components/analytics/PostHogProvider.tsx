'use client';

/**
 * PostHog provider component.
 *
 * Initializes PostHog on mount and tracks page views on pathname changes.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthogAnalytics } from '@/context/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initPostHog();
            initialized.current = true;
        }
    }, []);

    useEffect(() => {
        if (pathname && initialized.current) {
            const url = searchParams?.size
                ? `${pathname}?${searchParams.toString()}`
                : pathname;
            posthogAnalytics.pageView(url);
        }
    }, [pathname, searchParams]);

    return <>{children}</>;
}
