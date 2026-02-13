export type AnalyticsEventName =
  | 'course_enrolled'
  | 'lesson_completed'
  | 'challenge_run'
  | 'challenge_passed'
  | 'credential_viewed'
  | 'auth_provider_clicked'
  | 'auth_registration_started';

export function trackEvent(eventName: AnalyticsEventName, props: Record<string, string | number>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', eventName, props);
    }
  } catch {
    // Analytics must never break product flows.
  }

  try {
    const posthog = (window as unknown as {
      posthog?: { capture?: (name: string, payload: Record<string, string | number>) => void };
    }).posthog;

    if (typeof posthog?.capture === 'function') {
      posthog.capture(eventName, props);
    }
  } catch {
    // Analytics must never break product flows.
  }
}
