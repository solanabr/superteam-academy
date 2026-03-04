"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

// Lazily loaded PostHog instance
let _posthogInstance: { capture: (event: string, properties?: Record<string, unknown>) => void; __loaded?: boolean; init: (key: string, options: Record<string, unknown>) => void } | null = null;

async function getPostHog() {
  if (!POSTHOG_KEY) return null;
  if (_posthogInstance) return _posthogInstance;
  const mod = await import("posthog-js");
  _posthogInstance = mod.default;
  return _posthogInstance;
}

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    const url =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    getPostHog().then((ph) => ph?.capture("$pageview", { $current_url: url }));
    // Also fire GA4 pageview on route changes
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname });
    }
  }, [pathname, searchParams]);

  return null;
}

function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY || initialized.current) return;
    initialized.current = true;
    getPostHog().then((ph) => {
      if (ph && !ph.__loaded) {
        ph.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false,
          persistence: "localStorage",
        });
      }
    });
  }, []);

  return (
    <>
      <PageviewTracker />
      {children}
    </>
  );
}
