"use client";

import Script from "next/script";

/* Extend Window so TypeScript knows about gtag / dataLayer */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

/**
 * Track a custom GA4 event.
 *
 * @example
 * trackEvent('sign_up', { method: 'wallet' });
 */
export function trackEvent(eventName: string, params?: Record<string, string>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

/** Renders the Google Analytics 4 gtag.js scripts. Does nothing when NEXT_PUBLIC_GA4_ID is unset. */
export function Analytics() {
  if (!GA4_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
