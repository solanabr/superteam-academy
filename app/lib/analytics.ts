/**
 * Analytics for user behavior insights. Stub: log or send to future endpoint.
 * Production: wire to GA4 (NEXT_PUBLIC_GA_ID), heatmaps (Hotjar/PostHog/Clarity), and Sentry (NEXT_PUBLIC_SENTRY_DSN) for error monitoring.
 */

export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'lesson_complete'; courseId: string; lessonId: string; wallet?: string }
  | { name: 'enroll'; courseId: string; wallet?: string }
  | { name: 'course_start'; courseId: string; wallet?: string };

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event);
  }
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {});
}
