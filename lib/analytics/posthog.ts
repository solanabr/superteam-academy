export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

interface PostHogClient {
  init: (key: string, config: Record<string, unknown>) => void
  identify: (id: string, properties?: Record<string, unknown>) => void
  reset: () => void
  capture: (event: string, properties?: Record<string, unknown>) => void
}

let posthogInstance: PostHogClient | null = null;

const getPosthog = async (): Promise<PostHogClient | null> => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        if (!posthogInstance) {
            const { default: posthog } = await import('posthog-js');
            posthogInstance = posthog as unknown as PostHogClient;
        }
        return posthogInstance;
    }
    return null;
}

export const initPostHog = async () => {
    const ph = await getPosthog();
    if (ph) {
        ph.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true,
            autocapture: true,
        });
    }
};

export const identifyUser = async (id: string, properties?: Record<string, unknown>) => {
    const ph = await getPosthog();
    if (ph) {
        ph.identify(id, properties);
    }
};

export const resetUser = async () => {
    const ph = await getPosthog();
    if (ph) {
        ph.reset();
    }
};

export const capture = async (event: string, properties?: Record<string, unknown>) => {
    const ph = await getPosthog();
    if (ph) {
        ph.capture(event, properties);
    }
};
