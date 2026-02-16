import { AnalyticsEvent } from '@/types';

/**
 * Analytics service that integrates with GA4, PostHog, and Sentry.
 * All methods are safe to call even if providers are not configured.
 */

// ============================================
// Google Analytics 4
// ============================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, properties?: Record<string, unknown>) => void;
    };
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

export function trackPageView(url: string) {
  gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
    page_path: url,
  });
}

// ============================================
// PostHog
// ============================================

function posthogCapture(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties);
  }
}

function posthogIdentify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.identify(userId, properties);
  }
}

// ============================================
// Unified Analytics
// ============================================

export function trackEvent(event: AnalyticsEvent) {
  // GA4
  gtag('event', event.type, event);

  // PostHog
  posthogCapture(event.type, event as unknown as Record<string, unknown>);

  // Console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.type, event);
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthogIdentify(userId, properties);

  gtag('set', 'user_properties', {
    user_id: userId,
    ...properties,
  });
}

// ============================================
// Sentry Error Tracking
// ============================================

export function captureError(error: Error, context?: Record<string, unknown>) {
  // In production, send to Sentry
  // Sentry.captureException(error, { extra: context });

  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry]', error, context);
  }
}

// ============================================
// Pre-built Event Helpers
// ============================================

export const analytics = {
  pageView: (page: string) => trackEvent({ type: 'page_view', page }),
  courseView: (courseId: string) => trackEvent({ type: 'course_view', courseId }),
  lessonStart: (courseId: string, lessonId: string) =>
    trackEvent({ type: 'lesson_start', courseId, lessonId }),
  lessonComplete: (courseId: string, lessonId: string, xpEarned: number) =>
    trackEvent({ type: 'lesson_complete', courseId, lessonId, xpEarned }),
  challengeAttempt: (challengeId: string, success: boolean) =>
    trackEvent({ type: 'challenge_attempt', challengeId, success }),
  achievementUnlock: (achievementId: string) =>
    trackEvent({ type: 'achievement_unlock', achievementId }),
  walletConnect: (walletType: string) =>
    trackEvent({ type: 'wallet_connect', walletType }),
  signIn: (method: 'wallet' | 'google' | 'github') =>
    trackEvent({ type: 'sign_in', method }),
};
