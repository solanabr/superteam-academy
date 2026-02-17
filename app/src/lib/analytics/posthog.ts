// PostHog initialization
// Configured when NEXT_PUBLIC_POSTHOG_KEY is set

let posthogInstance: unknown = null;

export async function initPostHog() {
  if (typeof window === "undefined") return null;
  if (posthogInstance) return posthogInstance;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // We handle this manually
      capture_pageleave: true,
    });
    posthogInstance = posthog;
    return posthog;
  } catch {
    return null;
  }
}

export function getPostHog() {
  return posthogInstance;
}
