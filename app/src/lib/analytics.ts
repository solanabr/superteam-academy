/**
 * Custom analytics event tracking for GA4 + PostHog + Sentry.
 * Events are sent via gtag when GA_MEASUREMENT_ID is configured,
 * and via PostHog when POSTHOG_KEY is configured.
 *
 * PostHog is loaded lazily via dynamic import to keep it off the
 * critical rendering path (~100KB savings on initial bundle).
 */

type AnalyticsEvent =
  | {
      name: "course_enrolled";
      params: { course_slug: string; course_title: string };
    }
  | {
      name: "lesson_completed";
      params: { course_slug: string; lesson_id: string; xp_earned: number };
    }
  | {
      name: "achievement_claimed";
      params: { achievement_id: string; achievement_name: string };
    }
  | { name: "language_changed"; params: { locale: string } }
  | { name: "wallet_connected"; params: { wallet_type: string } }
  | {
      name: "certificate_shared";
      params: { platform: "twitter" | "linkedin"; cert_id: string };
    }
  | {
      name: "code_challenge_run";
      params: { course_slug: string; lesson_id: string; passed: boolean };
    }
  | {
      name: "onboarding_completed";
      params: { skill_level: string; interests: string[] };
    }
  | {
      name: "course_viewed";
      params: { course_slug: string; course_title: string };
    }
  | {
      name: "search_performed";
      params: { query: string; result_count: number };
    }
  | {
      name: "daily_challenge_started";
      params: { challenge_id: string };
    }
  | {
      name: "daily_challenge_completed";
      params: {
        challenge_id: string;
        tests_passed: number;
        total_tests: number;
      };
    }
  | {
      name: "discussion_thread_created";
      params: { scope: string; category: string };
    }
  | {
      name: "discussion_comment_posted";
      params: { thread_id: string };
    };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Link user identity across PostHog and Sentry.
 * Call once when auth state resolves with a logged-in user.
 */
export function identifyUser(
  userId: string,
  traits: Record<string, string | boolean | number | null>,
) {
  if (typeof window === "undefined") return;

  import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.identify(userId, traits);
      }
    })
    .catch(() => {});

  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.setUser({ id: userId, ...traits });
    })
    .catch(() => {});
}

/**
 * Dispatch an analytics event to all configured providers (GA4 + PostHog).
 * Safe to call during SSR (no-ops when `window` is undefined).
 */
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", event.name, event.params);
  }

  import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.capture(event.name, event.params);
      }
    })
    .catch(() => {});
}
