type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: string, properties?: EventProperties) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && 'va' in window) {
    (window as any).va?.track(name, properties);
  }
  // Google Analytics 4
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', name, properties);
  }
}

// Pre-defined events for type safety
export const AnalyticsEvents = {
  COURSE_ENROLLED: 'course_enrolled',
  LESSON_COMPLETED: 'lesson_completed',
  CHALLENGE_SUBMITTED: 'challenge_submitted',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  CREDENTIAL_VIEWED: 'credential_viewed',
  WALLET_CONNECTED: 'wallet_connected',
  LANGUAGE_CHANGED: 'language_changed',
  THEME_CHANGED: 'theme_changed',
} as const;
