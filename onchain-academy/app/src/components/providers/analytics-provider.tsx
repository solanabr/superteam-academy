"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export function AnalyticsProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key && host) {
      posthog.init(key, { api_host: host, capture_pageview: true });
    }
  }, []);

  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!measurementId || typeof window === "undefined") {
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", measurementId);
  }, []);

  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!clarityId || typeof window === "undefined") {
      return;
    }
    if (document.getElementById("clarity-script")) {
      return;
    }
    const script = document.createElement("script");
    script.id = "clarity-script";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${clarityId}`;
    document.head.appendChild(script);
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}
