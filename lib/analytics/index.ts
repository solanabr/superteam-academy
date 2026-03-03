import * as ga4 from './ga4';
import * as posthog from './posthog';

/**
 * Unified Analytics Tracking
 * Sends events to both Google Analytics 4 and PostHog
 */

export const trackEvent = (
    eventName: string,
    properties?: Record<string, string | number | boolean>
) => {
    // GA4 Tracking
    ga4.event(eventName, properties);

    // PostHog Tracking
    posthog.capture(eventName, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
    posthog.identifyUser(userId, properties);
};

export const resetUser = () => {
    posthog.resetUser();
};

export const pageView = (url: string) => {
    ga4.pageview(url);
    posthog.capture('$pageview', { $current_url: url });
};
