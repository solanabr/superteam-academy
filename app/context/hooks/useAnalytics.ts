'use client';

/**
 * Unified analytics hook.
 *
 * Wraps GA4, PostHog, and Sentry into a single interface.
 * All methods fire across all configured providers.
 */

import { useCallback } from 'react';
import { pageView as ga4PageView, analytics as ga4Analytics, event as ga4Event, type GAEvent } from '@/context/analytics/ga4';
import { posthogAnalytics } from '@/context/analytics/posthog';
import { sentryAnalytics } from '@/context/analytics/sentry';

export function useAnalytics() {
    const trackPageView = useCallback((url: string) => {
        ga4PageView(url);
        posthogAnalytics.pageView(url);
    }, []);

    const trackEvent = useCallback((action: GAEvent, params?: Record<string, unknown>) => {
        ga4Event(action, params);
        posthogAnalytics.capture(action, params);
        sentryAnalytics.addBreadcrumb({
            category: 'analytics',
            message: action,
            data: params,
            level: 'info',
        });
    }, []);

    const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
        posthogAnalytics.identify(userId, properties);
        sentryAnalytics.setUser({ id: userId, ...properties });
    }, []);

    const reset = useCallback(() => {
        posthogAnalytics.reset();
        sentryAnalytics.setUser(null);
    }, []);

    const captureError = useCallback((error: unknown, context?: Record<string, unknown>) => {
        sentryAnalytics.captureException(error, context);
    }, []);

    return {
        trackPageView,
        trackEvent,
        identify,
        reset,
        captureError,

        // Convenience methods matching custom event table
        signUp: useCallback((method: string) => {
            ga4Analytics.signUp(method);
            posthogAnalytics.capture('sign_up', { method });
        }, []),

        login: useCallback((method: string) => {
            ga4Analytics.login(method);
            posthogAnalytics.capture('login', { method });
        }, []),

        enrollCourse: useCallback((courseId: string, trackId?: number) => {
            ga4Analytics.enrollCourse(courseId, trackId);
            posthogAnalytics.capture('enroll_course', { course_id: courseId, track_id: trackId });
        }, []),

        completeLesson: useCallback((courseId: string, lessonIndex: number, xpEarned: number) => {
            ga4Analytics.completeLesson(courseId, lessonIndex, xpEarned);
            posthogAnalytics.capture('complete_lesson', { course_id: courseId, lesson_index: lessonIndex, xp_earned: xpEarned });
        }, []),

        completeCourse: useCallback((courseId: string, totalXp: number) => {
            ga4Analytics.completeCourse(courseId, totalXp);
            posthogAnalytics.capture('complete_course', { course_id: courseId, total_xp: totalXp });
        }, []),

        earnXp: useCallback((amount: number, source: string) => {
            ga4Analytics.earnXp(amount, source);
            posthogAnalytics.capture('earn_xp', { amount, source });
        }, []),

        unlockAchievement: useCallback((achievementId: string) => {
            ga4Analytics.unlockAchievement(achievementId);
            posthogAnalytics.capture('unlock_achievement', { achievement_id: achievementId });
        }, []),

        viewCredential: useCallback((trackId: number) => {
            ga4Analytics.viewCredential(trackId);
            posthogAnalytics.capture('view_credential', { track_id: trackId });
        }, []),

        linkWallet: useCallback((walletType: string) => {
            ga4Analytics.linkWallet(walletType);
            posthogAnalytics.capture('link_wallet', { wallet_type: walletType });
        }, []),
    };
}
