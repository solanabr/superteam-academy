"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hasAnalyticsConsent } from "@/components/ui/cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: [string, ...unknown[]]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Lazy-loaded PostHog reference
let posthogInstance: typeof import("posthog-js").default | null = null;

async function getPostHog() {
  if (!POSTHOG_KEY || !hasAnalyticsConsent()) return null;
  if (posthogInstance) return posthogInstance;
  const { default: posthog } = await import("posthog-js");
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-mask]",
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
  posthogInstance = posthog;
  return posthog;
}

// GA4 helpers
function gtagPageview(url: string) {
  if (!hasAnalyticsConsent()) return;
  if (typeof window !== "undefined" && GA_ID && window.gtag) {
    window.gtag("config", GA_ID, { page_path: url });
  }
}

// Custom event tracking
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!hasAnalyticsConsent()) return;
  // GA4
  if (typeof window !== "undefined" && GA_ID && window.gtag) {
    window.gtag("event", name, properties);
  }
  // PostHog (lazy)
  if (POSTHOG_KEY) {
    getPostHog().then((ph) => ph?.capture(name, properties));
  }
}

// Pre-defined events
export const analytics = {
  courseViewed: (courseId: string, track: string) =>
    trackEvent("course_viewed", { course_id: courseId, track }),
  courseStarted: (courseId: string) =>
    trackEvent("course_started", { course_id: courseId }),
  courseCompleted: (courseId: string, totalXp: number) =>
    trackEvent("course_completed", { course_id: courseId, total_xp: totalXp }),
  lessonStarted: (courseId: string, lessonId: string) =>
    trackEvent("lesson_started", { course_id: courseId, lesson_id: lessonId }),
  lessonCompleted: (courseId: string, lessonId: string, xp: number) =>
    trackEvent("lesson_completed", {
      course_id: courseId,
      lesson_id: lessonId,
      xp_earned: xp,
    }),
  challengeRun: (courseId: string, lessonId: string, passed: boolean) =>
    trackEvent("challenge_run", {
      course_id: courseId,
      lesson_id: lessonId,
      passed,
    }),
  courseEnrolled: (courseId: string) =>
    trackEvent("course_enrolled", { course_id: courseId }),
  walletConnected: (wallet: string) =>
    trackEvent("wallet_connected", { wallet_type: wallet }),
  achievementUnlocked: (achievementId: string) =>
    trackEvent("achievement_unlocked", { achievement_id: achievementId }),
  credentialViewed: (credentialId: string) =>
    trackEvent("credential_viewed", { credential_id: credentialId }),
  searchPerformed: (query: string) => trackEvent("search_performed", { query }),
  filterApplied: (filterType: string, value: string) =>
    trackEvent("filter_applied", { filter_type: filterType, value }),
  languageChanged: (locale: string, previousLocale: string) =>
    trackEvent("language_changed", { locale, previous_locale: previousLocale }),
};

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  // Lazy-initialize PostHog only if consent is granted
  useEffect(() => {
    if (initialized.current || !POSTHOG_KEY) return;

    const initIfConsented = () => {
      if (!hasAnalyticsConsent() || initialized.current) return;
      initialized.current = true;
      if ("requestIdleCallback" in window) {
        (window.requestIdleCallback as (cb: () => void) => number)(() => getPostHog());
      } else {
        setTimeout(() => getPostHog(), 2000);
      }
    };

    initIfConsented();

    const handler = () => initIfConsented();
    window.addEventListener("analytics-consent-granted", handler);
    return () => window.removeEventListener("analytics-consent-granted", handler);
  }, []);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    gtagPageview(url);
    if (POSTHOG_KEY) {
      getPostHog().then((ph) =>
        ph?.capture("$pageview", { $current_url: url }),
      );
    }
  }, [pathname, searchParams]);

  return null;
}
