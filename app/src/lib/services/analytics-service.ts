/**
 * Analytics Service
 * Unified interface for analytics tracking across multiple providers
 * Supports GA4, PostHog, and custom events
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | undefined>;
  userId?: string;
}

export interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  walletAddress?: string;
  level?: number;
  totalXP?: number;
  coursesCompleted?: number;
  currentStreak?: number;
  language?: string;
}

// Helper to safely access window (SSR-safe)
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function scheduleNonCriticalLoad(task: () => void): void {
  if (!isBrowser()) return;

  let executed = false;
  const runOnce = () => {
    if (executed) return;
    executed = true;
    task();
  };

  const onInteraction = () => {
    runOnce();
    window.removeEventListener('pointerdown', onInteraction);
    window.removeEventListener('keydown', onInteraction);
    window.removeEventListener('touchstart', onInteraction);
  };

  window.addEventListener('pointerdown', onInteraction, { once: true, passive: true });
  window.addEventListener('keydown', onInteraction, { once: true, passive: true });
  window.addEventListener('touchstart', onInteraction, { once: true, passive: true });

  const maybeGlobal = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof maybeGlobal.requestIdleCallback === 'function') {
    maybeGlobal.requestIdleCallback(runOnce, { timeout: 3000 });
  } else {
    globalThis.setTimeout(runOnce, 1500);
  }
}

/**
 * Google Analytics 4
 */
class GA4 {
  private measurementId: string | undefined;
  private initialized = false;

  init(measurementId: string): void {
    if (!isBrowser() || this.initialized) return;
    this.measurementId = measurementId;

    // Initialize dataLayer
    (window as unknown as { dataLayer: unknown[] }).dataLayer =
      (window as unknown as { dataLayer: unknown[] }).dataLayer || [];
    function gtag(...args: unknown[]): void {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args);
    }
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // We'll send page views manually
    });

    scheduleNonCriticalLoad(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    });

    this.initialized = true;
    console.log('[Analytics] GA4 initialized');
  }

  trackPageView(event: PageViewEvent): void {
    if (!isBrowser() || !this.initialized) return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag('event', 'page_view', {
        page_path: event.path,
        page_title: event.title,
        page_referrer: event.referrer,
      });
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!isBrowser() || !this.initialized) return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag('event', event.name, event.properties);
    }
  }

  setUser(properties: UserProperties): void {
    if (!isBrowser() || !this.initialized) return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag('config', this.measurementId, {
        user_id: properties.userId,
      });
      gtag('set', 'user_properties', {
        level: properties.level,
        total_xp: properties.totalXP,
        courses_completed: properties.coursesCompleted,
        language: properties.language,
      });
    }
  }
}

/**
 * PostHog Analytics (with heatmaps)
 */
class PostHogAnalytics {
  private initialized = false;

  init(apiKey: string, host?: string): void {
    if (!isBrowser() || this.initialized) return;

    scheduleNonCriticalLoad(() => {
      const script = document.createElement('script');
      script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${apiKey}',{api_host:'${host || 'https://app.posthog.com'}', autocapture: true, capture_pageview: false, capture_pageleave: true});
    `;
      document.head.appendChild(script);
    });

    this.initialized = true;
    console.log('[Analytics] PostHog initialized');
  }

  trackPageView(event: PageViewEvent): void {
    if (!isBrowser() || !this.initialized) return;

    const posthog = (
      window as unknown as { posthog?: { capture: (event: string, props?: object) => void } }
    ).posthog;
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: event.path,
        $title: event.title,
        $referrer: event.referrer,
      });
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!isBrowser() || !this.initialized) return;

    const posthog = (
      window as unknown as { posthog?: { capture: (event: string, props?: object) => void } }
    ).posthog;
    if (posthog) {
      posthog.capture(event.name, event.properties);
    }
  }

  setUser(properties: UserProperties): void {
    if (!isBrowser() || !this.initialized) return;

    const posthog = (
      window as unknown as { posthog?: { identify: (id: string, props?: object) => void } }
    ).posthog;
    if (posthog) {
      posthog.identify(properties.userId, {
        email: properties.email,
        name: properties.name,
        wallet_address: properties.walletAddress,
        level: properties.level,
        total_xp: properties.totalXP,
        courses_completed: properties.coursesCompleted,
        current_streak: properties.currentStreak,
        language: properties.language,
      });
    }
  }

  reset(): void {
    if (!isBrowser() || !this.initialized) return;

    const posthog = (window as unknown as { posthog?: { reset: () => void } }).posthog;
    if (posthog) {
      posthog.reset();
    }
  }
}

/**
 * Unified Analytics Service
 */
class AnalyticsService {
  private ga4 = new GA4();
  private posthog = new PostHogAnalytics();
  private debugMode = false;

  /**
   * Initialize all analytics providers
   */
  init(config: {
    ga4MeasurementId?: string;
    posthogApiKey?: string;
    posthogHost?: string;
    debug?: boolean;
  }): void {
    this.debugMode = config.debug || false;

    if (config.ga4MeasurementId) {
      this.ga4.init(config.ga4MeasurementId);
    }

    if (config.posthogApiKey) {
      this.posthog.init(config.posthogApiKey, config.posthogHost);
    }

    if (this.debugMode) {
      console.log('[Analytics] Service initialized', config);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string): void {
    const event: PageViewEvent = {
      path,
      title,
      referrer: isBrowser() ? document.referrer : undefined,
    };

    if (this.debugMode) {
      console.log('[Analytics] Page view:', event);
    }

    this.ga4.trackPageView(event);
    this.posthog.trackPageView(event);
  }

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean | undefined>
  ): void {
    const event: AnalyticsEvent = { name, properties };

    if (this.debugMode) {
      console.log('[Analytics] Event:', event);
    }

    this.ga4.trackEvent(event);
    this.posthog.trackEvent(event);
  }

  /**
   * Set user properties for identification
   */
  setUser(properties: UserProperties): void {
    if (this.debugMode) {
      console.log('[Analytics] Set user:', properties);
    }

    this.ga4.setUser(properties);
    this.posthog.setUser(properties);
  }

  /**
   * Reset user (on logout)
   */
  resetUser(): void {
    if (this.debugMode) {
      console.log('[Analytics] Reset user');
    }

    this.posthog.reset();
  }

  // ============================================
  // Pre-defined Event Helpers
  // ============================================

  /**
   * Track course enrollment
   */
  trackCourseEnrollment(courseId: string, courseTitle: string): void {
    this.trackEvent('course_enrolled', {
      course_id: courseId,
      course_title: courseTitle,
    });
  }

  /**
   * Track lesson start
   */
  trackLessonStart(courseId: string, lessonId: string, lessonTitle: string): void {
    this.trackEvent('lesson_started', {
      course_id: courseId,
      lesson_id: lessonId,
      lesson_title: lessonTitle,
    });
  }

  /**
   * Track lesson completion
   */
  trackLessonComplete(
    courseId: string,
    lessonId: string,
    lessonTitle: string,
    xpEarned: number
  ): void {
    this.trackEvent('lesson_completed', {
      course_id: courseId,
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      xp_earned: xpEarned,
    });
  }

  /**
   * Track challenge attempt
   */
  trackChallengeAttempt(
    challengeId: string,
    passed: boolean,
    testsPassed: number,
    testsFailed: number
  ): void {
    this.trackEvent('challenge_attempted', {
      challenge_id: challengeId,
      passed,
      tests_passed: testsPassed,
      tests_failed: testsFailed,
    });
  }

  /**
   * Track challenge completion
   */
  trackChallengeComplete(challengeId: string, xpEarned: number, timeSpent: number): void {
    this.trackEvent('challenge_completed', {
      challenge_id: challengeId,
      xp_earned: xpEarned,
      time_spent_seconds: timeSpent,
    });
  }

  /**
   * Track course completion
   */
  trackCourseComplete(courseId: string, courseTitle: string, totalXpEarned: number): void {
    this.trackEvent('course_completed', {
      course_id: courseId,
      course_title: courseTitle,
      total_xp_earned: totalXpEarned,
    });
  }

  /**
   * Track XP earned
   */
  trackXPEarned(amount: number, source: string, sourceId?: string): void {
    this.trackEvent('xp_earned', {
      amount,
      source,
      source_id: sourceId,
    });
  }

  /**
   * Track level up
   */
  trackLevelUp(newLevel: number, totalXP: number): void {
    this.trackEvent('level_up', {
      new_level: newLevel,
      total_xp: totalXP,
    });
  }

  /**
   * Track achievement unlocked
   */
  trackAchievementUnlocked(achievementId: string, achievementName: string): void {
    this.trackEvent('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_name: achievementName,
    });
  }

  /**
   * Track streak milestone
   */
  trackStreakMilestone(streakDays: number): void {
    this.trackEvent('streak_milestone', {
      streak_days: streakDays,
    });
  }

  /**
   * Track wallet connection
   */
  trackWalletConnected(walletType: string): void {
    this.trackEvent('wallet_connected', {
      wallet_type: walletType,
    });
  }

  /**
   * Track sign up
   */
  trackSignUp(method: 'wallet' | 'google' | 'github'): void {
    this.trackEvent('sign_up', {
      method,
    });
  }

  /**
   * Track sign in
   */
  trackSignIn(method: 'wallet' | 'google' | 'github'): void {
    this.trackEvent('sign_in', {
      method,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent('search', {
      query,
      results_count: resultsCount,
    });
  }

  /**
   * Track code editor actions
   */
  trackCodeEditorAction(action: 'run' | 'reset' | 'show_solution' | 'reveal_hint'): void {
    this.trackEvent('code_editor_action', {
      action,
    });
  }

  /**
   * Track language change
   */
  trackLanguageChange(from: string, to: string): void {
    this.trackEvent('language_changed', {
      from_language: from,
      to_language: to,
    });
  }

  /**
   * Track theme change
   */
  trackThemeChange(theme: 'light' | 'dark' | 'system'): void {
    this.trackEvent('theme_changed', {
      theme,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
