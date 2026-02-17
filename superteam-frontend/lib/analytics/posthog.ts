import posthog, { type PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let client: PostHog | null = null;

function isConfigured(): boolean {
  return POSTHOG_KEY !== "" && typeof window !== "undefined";
}

export function getPostHogClient(): PostHog | null {
  if (!isConfigured()) return null;

  if (!client) {
    client =
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            ph.debug();
          }
        },
      }) ?? null;
  }

  return client;
}

export function identify(
  userId: string,
  properties?: Record<string, string | number | boolean>,
): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.identify(userId, properties);
}

export function capture(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.capture(eventName, properties);
}

export function reset(): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.reset();
}
