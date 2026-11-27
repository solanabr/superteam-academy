/**
 * Google Analytics 4 wrapper.
 *
 * Loads the GA4 script tag only when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set.
 * All tracking calls gracefully degrade to no-ops when the env var is missing.
 */

/* global window, document */

import {
  hasAuthParams,
  stripAuthParams,
  stripQueryAndFragment,
} from "./telemetry-url";

declare global {
  interface Window {
    gtag: (
      command: string,
      targetOrEvent: string | Date | Record<string, unknown>,
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

const URL_CLEAN_POLL_MS = 250;

/**
 * The page's location with auth params removed. Campaign and referral params
 * stay, since GA4 reads attribution from them. gtag.js would otherwise fall back
 * to the raw `document.location` and `document.referrer`.
 */
function locationFields(): Record<string, string> {
  return {
    page_location: stripAuthParams(window.location.href),
    ...(document.referrer
      ? { page_referrer: stripAuthParams(document.referrer) }
      : {}),
  };
}

function isAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    GA4_ID.length > 0 &&
    typeof window.gtag === "function"
  );
}

function injectGtagScript(): void {
  // Avoids loading gtag.js twice; a foreign tag doesn't stop the stub and config.
  if (document.querySelector(`script[src*="googletagmanager"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);
}

/**
 * gtag.js's automatic history-change page view reports the URLs it sees itself,
 * ignoring `set`, so it can't load while the address bar holds auth params.
 * Until it loads, calls wait in the dataLayer with their location fields already
 * built, which keeps the landing page view and its attribution.
 *
 * The URL belongs to the sign-in handlers, which read the params whenever they
 * mount and remove them after network calls, so this only ever waits. If the
 * params stay for the whole page load, gtag.js doesn't load for that page.
 */
function loadGtagOnceUrlIsClean(): void {
  if (!hasAuthParams(window.location.href)) {
    injectGtagScript();
    return;
  }
  const timer = window.setInterval(() => {
    if (hasAuthParams(window.location.href)) return;
    window.clearInterval(timer);
    injectGtagScript();
  }, URL_CLEAN_POLL_MS);
}

/**
 * Sets up the gtag stub and config, and loads gtag.js once the URL is clean.
 * Safe to call multiple times — will only set up once.
 */
export function initGA4(): void {
  if (typeof window === "undefined" || GA4_ID.length === 0) return;

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
  // Before config, so nothing gtag.js sends on its own uses the raw URL.
  window.gtag("set", locationFields());
  window.gtag("config", GA4_ID, {
    send_page_view: false, // we manage page views ourselves
  });

  loadGtagOnceUrlIsClean();
}

/**
 * Track a custom event in GA4.
 */
export function trackGA4Event(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!isAvailable()) return;
  window.gtag("event", name, { ...params, ...locationFields() });
}

/**
 * Track a page view in GA4.
 */
export function trackGA4PageView(url: string): void {
  if (!isAvailable()) return;
  // Google's manual-pageview contract wants the FULL URL in page_location
  // (protocol included) plus page_title; page_path stays as a convenience
  // dimension for existing reports.
  window.gtag("set", locationFields());
  window.gtag("event", "page_view", {
    ...locationFields(),
    page_title: typeof document !== "undefined" ? document.title : undefined,
    page_path: stripQueryAndFragment(url),
  });
}
