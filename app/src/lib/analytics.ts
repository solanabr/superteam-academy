'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;

  // PostHog
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
    });
  }

  // GA4
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (gaId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const w = window as unknown as Record<string, unknown[]>;
    w.dataLayer = w.dataLayer || [];
    const gtag = (...args: unknown[]) => {
      w.dataLayer.push(args);
    };
    gtag('js', new Date());
    gtag('config', gaId);
  }

  initialized = true;
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  posthog.capture(name, properties);
}

export function identifyUser(wallet: string) {
  posthog.identify(wallet);
}
