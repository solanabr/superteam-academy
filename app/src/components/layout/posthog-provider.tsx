"use client";

import { useEffect } from "react";

let initialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    // Defer PostHog loading to idle time so it doesn't block LCP/TBT
    const init = () => {
      import("posthog-js").then(({ default: posthog }) => {
        const host =
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: false,
          persistence: "localStorage+cookie",
        });
        initialized = true;
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(init);
    } else {
      setTimeout(init, 200);
    }
  }, []);

  // Register service worker for PWA offline support
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
