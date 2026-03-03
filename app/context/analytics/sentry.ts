/**
 * Sentry error monitoring and performance tracking.
 *
 * Uses @sentry/nextjs v9 API (replayIntegration, not deprecated Replay constructor).
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Initialize Sentry. Called from sentry.client.config.ts and sentry.server.config.ts */
export function initSentry(): void {
    if (!SENTRY_DSN) return;

    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        environment: process.env.NODE_ENV,
        enabled: !!SENTRY_DSN,
    });
}

export const sentryAnalytics = {
    captureException(error: unknown, context?: Record<string, unknown>) {
        if (!SENTRY_DSN) return;
        Sentry.captureException(error, { extra: context });
    },

    captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
        if (!SENTRY_DSN) return;
        Sentry.captureMessage(message, level);
    },

    setUser(user: { id: string; email?: string; walletAddress?: string } | null) {
        if (!SENTRY_DSN) return;
        Sentry.setUser(user);
    },

    addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
        if (!SENTRY_DSN) return;
        Sentry.addBreadcrumb(breadcrumb);
    },
};
