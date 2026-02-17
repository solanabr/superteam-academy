export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  COURSE_VIEW: "course_view",
  LESSON_START: "lesson_start",
  LESSON_COMPLETE: "lesson_complete",
  CHALLENGE_ATTEMPT: "challenge_attempt",
  CHALLENGE_PASS: "challenge_pass",
  CHALLENGE_FAIL: "challenge_fail",
  ENROLLMENT: "enrollment",
  UNENROLLMENT: "unenrollment",
  COURSE_COMPLETE: "course_complete",
  XP_EARNED: "xp_earned",
  LEVEL_UP: "level_up",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
  STREAK_MILESTONE: "streak_milestone",
  STREAK_BROKEN: "streak_broken",
  WALLET_CONNECTED: "wallet_connected",
  SIGN_IN: "sign_in",
  SIGN_UP: "sign_up",
  LANGUAGE_CHANGED: "language_changed",
  THEME_CHANGED: "theme_changed",
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export function trackEvent(
  event: EventName,
  properties?: Record<string, unknown>,
) {
  // PostHog
  if (typeof window !== "undefined" && "posthog" in window) {
    const ph = (
      window as Record<
        string,
        { capture?: (name: string, props?: Record<string, unknown>) => void }
      >
    )["posthog"];
    ph?.capture?.(event, properties);
  }

  // GA4
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtag = (window as Record<string, (...args: unknown[]) => void>)[
      "gtag"
    ];
    gtag("event", event, properties);
  }

  // Dev logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, properties);
  }
}
