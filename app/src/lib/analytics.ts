"use client";

import posthog from "posthog-js";

const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let posthogReady = false;

export function initAnalytics() {
  if (posthogKey && typeof window !== "undefined" && !posthogReady) {
    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
    });
    posthogReady = true;
  }
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (posthogReady) posthog.capture(event, props);
  if (ga4Id && typeof window !== "undefined" && "gtag" in window) {
    (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag("event", event, props);
  }
}
