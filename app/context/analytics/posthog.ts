/**
 * PostHog analytics integration.
 *
 * Provides heatmaps, session recordings, and event tracking.
 * Initialized client-side only via PostHogProvider component.
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

/** Initialize PostHog client-side. Call once in a useEffect. */
export function initPostHog(): void {
    if (typeof window === 'undefined' || !POSTHOG_KEY) return;

    const isProd = process.env.NODE_ENV === 'production';

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false, // Manual tracking via useAnalytics hook
        capture_pageleave: true,
        disable_surveys: true, // Prevents surveys.js (31.8 KiB) + DM Sans font load
        opt_in_site_apps: false, // Blocks toolbar/site apps that also load DM Sans
        disable_session_recording: !isProd,
        session_recording: isProd
            ? { recordCrossOriginIframes: true }
            : undefined,
    });
}

function isLoaded(): boolean {
    return typeof window !== 'undefined' && posthog.__loaded;
}

export const posthogAnalytics = {
    identify(userId: string, properties?: Record<string, unknown>) {
        if (!isLoaded()) return;
        posthog.identify(userId, properties);
    },

    capture(eventName: string, properties?: Record<string, unknown>) {
        if (!isLoaded()) return;
        posthog.capture(eventName, properties);
    },

    pageView(url: string) {
        if (!isLoaded()) return;
        posthog.capture('$pageview', { $current_url: url });
    },

    setPersonProperties(properties: Record<string, unknown>) {
        if (!isLoaded()) return;
        posthog.setPersonProperties(properties);
    },

    reset() {
        if (!isLoaded()) return;
        posthog.reset();
    },
};
