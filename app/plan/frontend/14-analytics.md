# Analytics Service

## Overview

The Analytics Service integrates Google Analytics 4, heatmaps (PostHog), and error monitoring (Sentry).

## Analytics Stack

| Tool | Purpose |
|------|---------|
| GA4 | User behavior, conversions |
| PostHog | Heatmaps, session recordings |
| Sentry | Error monitoring, performance |

## Implementation

### 1. GA4 Setup

```typescript
// lib/analytics/ga4.ts
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// Event types
export type GAEvent = 
  | 'page_view'
  | 'sign_up'
  | 'login'
  | 'enroll_course'
  | 'complete_lesson'
  | 'complete_course'
  | 'earn_xp'
  | 'unlock_achievement'
  | 'view_credential';

export function pageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

export function event(action: GAEvent, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
}

// Specific events
export const analytics = {
  signUp: (method: 'wallet' | 'google' | 'github') => {
    event('sign_up', { method });
  },
  
  login: (method: 'wallet' | 'google' | 'github') => {
    event('login', { method });
  },
  
  enrollCourse: (courseId: string, courseName: string) => {
    event('enroll_course', {
      course_id: courseId,
      course_name: courseName,
    });
  },
  
  completeLesson: (courseId: string, lessonId: string, xpEarned: number) => {
    event('complete_lesson', {
      course_id: courseId,
      lesson_id: lessonId,
      xp_earned: xpEarned,
    });
  },
  
  completeCourse: (courseId: string, totalXp: number) => {
    event('complete_course', {
      course_id: courseId,
      total_xp: totalXp,
    });
  },
  
  earnXp: (amount: number, source: string) => {
    event('earn_xp', {
      amount,
      source,
    });
  },
  
  unlockAchievement: (achievementId: string, achievementName: string) => {
    event('unlock_achievement', {
      achievement_id: achievementId,
      achievement_name: achievementName,
    });
  },
  
  viewCredential: (credentialId: string, trackName: string) => {
    event('view_credential', {
      credential_id: credentialId,
      track_name: trackName,
    });
  },
};
```

### 2. GA4 Script Component

```typescript
// components/analytics/GoogleAnalytics.tsx
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
```

### 3. PostHog Setup

```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function initPostHog() {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageviews: false, // We'll track manually
      capture_pageleave: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    });
  }
}

export const posthogAnalytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.identify(userId, traits);
    }
  },
  
  capture: (event: string, properties?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.capture(event, properties);
    }
  },
  
  pageView: (url: string) => {
    if (posthog.__loaded) {
      posthog.capture('$pageview', { $current_url: url });
    }
  },
  
  setPersonProperties: (properties: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.people.set(properties);
    }
  },
  
  reset: () => {
    if (posthog.__loaded) {
      posthog.reset();
    }
  },
};
```

```typescript
// components/analytics/PostHogProvider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthogAnalytics } from '@/lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    initPostHog();
  }, []);
  
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
      posthogAnalytics.pageView(url);
    }
  }, [pathname, searchParams]);
  
  return <>{children}</>;
}
```

### 4. Sentry Setup

```typescript
// lib/analytics/sentry.ts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV;

export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
    });
  }
}

export const sentryAnalytics = {
  captureException: (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, { extra: context });
  },
  
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level);
  },
  
  setUser: (user: { id: string; email?: string; wallet?: string } | null) => {
    Sentry.setUser(user);
  },
  
  addBreadcrumb: (category: string, message: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  },
  
  withScope: (callback: (scope: Sentry.Scope) => void) => {
    Sentry.withScope(callback);
  },
};
```

```typescript
// sentry.client.config.ts
import { initSentry } from './lib/analytics/sentry';

initSentry();
```

```typescript
// sentry.server.config.ts
import { initSentry } from './lib/analytics/sentry';

initSentry();
```

### 5. Combined Analytics Hook

```typescript
// hooks/useAnalytics.ts
import { useCallback } from 'react';
import { analytics } from '@/lib/analytics/ga4';
import { posthogAnalytics } from '@/lib/analytics/posthog';
import { sentryAnalytics } from '@/lib/analytics/sentry';

export function useAnalytics() {
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    // Track in GA4
    analytics.event(event as any, properties);
    
    // Track in PostHog
    posthogAnalytics.capture(event, properties);
  }, []);
  
  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    posthogAnalytics.identify(userId, traits);
    sentryAnalytics.setUser({
      id: userId,
      email: traits?.email,
      wallet: traits?.wallet_address,
    });
  }, []);
  
  const reset = useCallback(() => {
    posthogAnalytics.reset();
    sentryAnalytics.setUser(null);
  }, []);
  
  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    sentryAnalytics.captureException(error, context);
  }, []);
  
  return {
    trackEvent,
    identify,
    reset,
    captureError,
    
    // Convenience methods
    signUp: (method: 'wallet' | 'google' | 'github') => {
      analytics.signUp(method);
      trackEvent('sign_up', { method });
    },
    
    login: (method: 'wallet' | 'google' | 'github') => {
      analytics.login(method);
      trackEvent('login', { method });
    },
    
    enrollCourse: (courseId: string, courseName: string) => {
      analytics.enrollCourse(courseId, courseName);
      trackEvent('enroll_course', { courseId, courseName });
    },
    
    completeLesson: (courseId: string, lessonId: string, xpEarned: number) => {
      analytics.completeLesson(courseId, lessonId, xpEarned);
      trackEvent('complete_lesson', { courseId, lessonId, xpEarned });
    },
    
    completeCourse: (courseId: string, totalXp: number) => {
      analytics.completeCourse(courseId, totalXp);
      trackEvent('complete_course', { courseId, totalXp });
    },
    
    earnXp: (amount: number, source: string) => {
      analytics.earnXp(amount, source);
      trackEvent('earn_xp', { amount, source });
    },
  };
}
```

### 6. Analytics Provider

```typescript
// providers/AnalyticsProvider.tsx
'use client';

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAnalytics />
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </>
  );
}
```

## Custom Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `sign_up` | User creates account | `method` |
| `login` | User logs in | `method` |
| `enroll_course` | User enrolls in course | `course_id`, `course_name` |
| `complete_lesson` | User completes lesson | `course_id`, `lesson_id`, `xp_earned` |
| `complete_course` | User completes course | `course_id`, `total_xp` |
| `earn_xp` | User earns XP | `amount`, `source` |
| `unlock_achievement` | User earns achievement | `achievement_id`, `achievement_name` |
| `view_credential` | User views credential | `credential_id`, `track_name` |
| `link_wallet` | User links wallet | - |
| `start_streak` | User starts streak | `streak_length` |
| `break_streak` | User breaks streak | `streak_length` |

## Privacy Considerations

- Cookie consent banner required
- Respect Do Not Track
- Allow users to opt-out
- Mask sensitive data in recordings
