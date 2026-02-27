'use client';

import { useEffect, useRef, createContext, useContext, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics, UserProperties } from '@/lib/services/analytics-service';

interface AnalyticsContextValue {
  trackEvent: (
    name: string,
    properties?: Record<string, string | number | boolean | undefined>
  ) => void;
  trackPageView: (path: string, title?: string) => void;
  setUser: (properties: UserProperties) => void;
  resetUser: () => void;
  // Pre-defined events
  trackCourseEnrollment: (courseId: string, courseTitle: string) => void;
  trackLessonStart: (courseId: string, lessonId: string, lessonTitle: string) => void;
  trackLessonComplete: (
    courseId: string,
    lessonId: string,
    lessonTitle: string,
    xpEarned: number
  ) => void;
  trackChallengeAttempt: (
    challengeId: string,
    passed: boolean,
    testsPassed: number,
    testsFailed: number
  ) => void;
  trackChallengeComplete: (challengeId: string, xpEarned: number, timeSpent: number) => void;
  trackCourseComplete: (courseId: string, courseTitle: string, totalXpEarned: number) => void;
  trackXPEarned: (amount: number, source: string, sourceId?: string) => void;
  trackLevelUp: (newLevel: number, totalXP: number) => void;
  trackAchievementUnlocked: (achievementId: string, achievementName: string) => void;
  trackStreakMilestone: (streakDays: number) => void;
  trackWalletConnected: (walletType: string) => void;
  trackSignUp: (method: 'wallet' | 'google' | 'github') => void;
  trackSignIn: (method: 'wallet' | 'google' | 'github') => void;
  trackSearch: (query: string, resultsCount: number) => void;
  trackCodeEditorAction: (action: 'run' | 'reset' | 'show_solution' | 'reveal_hint') => void;
  trackLanguageChange: (from: string, to: string) => void;
  trackThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {},
  trackPageView: () => {},
  setUser: () => {},
  resetUser: () => {},
  trackCourseEnrollment: () => {},
  trackLessonStart: () => {},
  trackLessonComplete: () => {},
  trackChallengeAttempt: () => {},
  trackChallengeComplete: () => {},
  trackCourseComplete: () => {},
  trackXPEarned: () => {},
  trackLevelUp: () => {},
  trackAchievementUnlocked: () => {},
  trackStreakMilestone: () => {},
  trackWalletConnected: () => {},
  trackSignUp: () => {},
  trackSignIn: () => {},
  trackSearch: () => {},
  trackCodeEditorAction: () => {},
  trackLanguageChange: () => {},
  trackThemeChange: () => {},
});

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

// Inner component that uses useSearchParams (requires Suspense)
function AnalyticsPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  // Initialize analytics on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    analytics.init({
      ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
      posthogApiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      debug: process.env.NODE_ENV === 'development',
    });
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!initialized.current) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    const title = typeof document !== 'undefined' ? document.title : undefined;

    analytics.trackPageView(url, title);
  }, [pathname, searchParams]);

  return null;
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const value: AnalyticsContextValue = {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    setUser: analytics.setUser.bind(analytics),
    resetUser: analytics.resetUser.bind(analytics),
    trackCourseEnrollment: analytics.trackCourseEnrollment.bind(analytics),
    trackLessonStart: analytics.trackLessonStart.bind(analytics),
    trackLessonComplete: analytics.trackLessonComplete.bind(analytics),
    trackChallengeAttempt: analytics.trackChallengeAttempt.bind(analytics),
    trackChallengeComplete: analytics.trackChallengeComplete.bind(analytics),
    trackCourseComplete: analytics.trackCourseComplete.bind(analytics),
    trackXPEarned: analytics.trackXPEarned.bind(analytics),
    trackLevelUp: analytics.trackLevelUp.bind(analytics),
    trackAchievementUnlocked: analytics.trackAchievementUnlocked.bind(analytics),
    trackStreakMilestone: analytics.trackStreakMilestone.bind(analytics),
    trackWalletConnected: analytics.trackWalletConnected.bind(analytics),
    trackSignUp: analytics.trackSignUp.bind(analytics),
    trackSignIn: analytics.trackSignIn.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackCodeEditorAction: analytics.trackCodeEditorAction.bind(analytics),
    trackLanguageChange: analytics.trackLanguageChange.bind(analytics),
    trackThemeChange: analytics.trackThemeChange.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={value}>
      <Suspense fallback={null}>
        <AnalyticsPageTracker />
      </Suspense>
      {children}
    </AnalyticsContext.Provider>
  );
}
