/**
 * Google Analytics 4 wrapper.
 *
 * Loads the GA4 script tag only when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set.
 * All tracking calls gracefully degrade to no-ops when the env var is missing.
 */

/* global window, document */

declare global {
  interface Window {
    gtag: (
      command: string,
      targetOrEvent: string | Date,
      params?: Record<string, unknown>
    ) => void;
    // gtag.js consumes the raw `arguments` objects pushed by the stub — the
    // array must be typed to carry them, not plain records.
    dataLayer: unknown[];
  }
}

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

// Stub + config must run exactly once per page load, tracked here — NOT by
// the presence of a googletagmanager script tag. A foreign tag (e.g. GTM
// injected by an extension or an embedded widget) would otherwise make init
// silently skip our own stub and config, and no hit would ever be sent.
let ga4Configured = false;

function isAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    GA4_ID.length > 0 &&
    typeof window.gtag === "function"
  );
}

/**
 * Injects the GA4 `<script>` tags into `<head>`.
 * Safe to call multiple times — will only inject once.
 */
export function initGA4(): void {
  if (typeof window === "undefined" || GA4_ID.length === 0) return;

  // The selector only guards SCRIPT INJECTION (avoid loading gtag.js twice);
  // stub + config below run regardless, gated by the module flag.
  if (!document.querySelector(`script[src*="googletagmanager"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);
  }

  if (ga4Configured) return;
  ga4Configured = true;

  window.dataLayer = window.dataLayer ?? [];
  // Google's snippet verbatim: gtag.js only recognizes commands pushed as the
  // raw `arguments` object. Pushing a plain object instead is silently ignored
  // by the library — config never registers, no hit is ever sent, and GA4
  // shows "data collection isn't active" forever. That exact bug shipped at
  // launch; do not "clean this up" into an object push.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA4_ID, {
    send_page_view: false, // we manage page views ourselves
  });
}

/**
 * Track a custom event in GA4.
 */
export function trackGA4Event(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!isAvailable()) return;
  window.gtag("event", name, params);
}

/**
 * Track a page view in GA4.
 */
export function trackGA4PageView(url: string): void {
  if (!isAvailable()) return;
  // Google's manual-pageview contract wants the FULL URL in page_location
  // (protocol included) plus page_title; page_path stays as a convenience
  // dimension for existing reports.
  window.gtag("event", "page_view", {
    page_location: typeof window !== "undefined" ? window.location.href : url,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    page_path: url,
  });
}
