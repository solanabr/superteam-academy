'use client';

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_VERSION = process.env.NEXT_PUBLIC_HOTJAR_VERSION ?? '6';

/**
 * Analytics — Google Analytics 4 + Hotjar heatmaps
 *
 * Loaded only when the corresponding env vars are set:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_HOTJAR_ID=XXXXXXX
 *   NEXT_PUBLIC_HOTJAR_VERSION=6
 *
 * Set these in Vercel project settings → Environment Variables.
 * Scripts are loaded with strategy="afterInteractive" to avoid blocking paint.
 */
export default function Analytics() {
  return (
    <>
      {/* Google Analytics 4 */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Hotjar Heatmaps & Session Recordings */}
      {HOTJAR_ID && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_VERSION}};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Event tracking helpers (call these from page components)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    hj?: (...args: unknown[]) => void;
  }
}

/** Track a custom GA4 event */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/** Track lesson completion */
export function trackLessonComplete(lessonId: string, courseSlug: string, xp: number) {
  trackEvent('lesson_complete', { lesson_id: lessonId, course_slug: courseSlug, xp_earned: xp });
}

/** Track course enrollment */
export function trackCourseEnroll(courseSlug: string, courseLevel: string) {
  trackEvent('course_enroll', { course_slug: courseSlug, course_level: courseLevel });
}

/** Track wallet connection */
export function trackWalletConnect(walletName: string) {
  trackEvent('wallet_connect', { wallet_name: walletName });
}

/** Track challenge submission */
export function trackChallengeSubmit(challengeId: string, passed: boolean) {
  trackEvent('challenge_submit', { challenge_id: challengeId, passed });
}
