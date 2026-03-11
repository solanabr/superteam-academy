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
      targetOrEvent: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: Array<Record<string, unknown>>;
  }
}

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

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
  if (document.querySelector(`script[src*="googletagmanager"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(
    command: string,
    targetOrEvent: string,
    params?: Record<string, unknown>
  ) {
    window.dataLayer.push({ event: command, ...params, target: targetOrEvent });
  };

  window.gtag("js", new Date().toISOString());
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
  window.gtag("event", "page_view", {
    page_path: url,
  });
}
