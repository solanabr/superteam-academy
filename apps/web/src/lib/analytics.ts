/**
 * Analytics & Error Tracking
 *
 * Stubs for GA4, PostHog, and Sentry. Replace with real SDKs in production.
 */

// ---------------------------------------------------------------------------
// GA4
// ---------------------------------------------------------------------------
export function initGA4(measurementId?: string) {
  if (typeof window === 'undefined' || !measurementId) return;
  // Load gtag.js script dynamically
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  const w = window as unknown as Record<string, unknown>;
  w.dataLayer = (w.dataLayer as unknown[]) ?? [];
  function gtag(...args: unknown[]) {
    (w.dataLayer as unknown[]).push(args);
  }
  gtag('js', new Date());
  gtag('config', measurementId);
}

// ---------------------------------------------------------------------------
// PostHog
// ---------------------------------------------------------------------------
export function initPostHog(apiKey?: string) {
  if (typeof window === 'undefined' || !apiKey) return;
  // In production: import posthog from 'posthog-js' and call posthog.init(apiKey)
  console.debug('[PostHog] initialized (stub)', apiKey.slice(0, 8));
}

// ---------------------------------------------------------------------------
// Sentry
// ---------------------------------------------------------------------------
export function initSentry(dsn?: string) {
  if (typeof window === 'undefined' || !dsn) return;
  // In production: import * as Sentry from '@sentry/nextjs' and call Sentry.init({ dsn })
  console.debug('[Sentry] initialized (stub)', dsn.slice(0, 16));
}

// ---------------------------------------------------------------------------
// Custom Event Tracking
// ---------------------------------------------------------------------------
function track(event: string, properties?: Record<string, unknown>) {
  // GA4
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const w = window as unknown as { gtag: (...a: unknown[]) => void };
    w.gtag('event', event, properties);
  }
  // PostHog
  // posthog?.capture(event, properties);
  console.debug(`[Analytics] ${event}`, properties);
}

export function trackPageView(url: string) {
  track('page_view', { page_path: url });
}

export function trackLessonComplete(lessonId: string, courseId: string, xp: number) {
  track('lesson_complete', { lessonId, courseId, xp });
}

export function trackCourseEnroll(courseId: string, courseTitle: string) {
  track('course_enroll', { courseId, courseTitle });
}

export function trackChallengeSubmit(challengeId: string, passed: boolean) {
  track('challenge_submit', { challengeId, passed });
}

export function trackQuizComplete(quizId: string, score: number) {
  track('quiz_complete', { quizId, score });
}

export function trackAchievementEarned(achievementId: string, name: string) {
  track('achievement_earned', { achievementId, name });
}
