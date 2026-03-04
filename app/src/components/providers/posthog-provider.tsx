"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

declare global {
  interface Window {
    __posthog_initialized?: boolean;
  }
}

const posthog_key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthog_host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function PostHogProvider({ children }: { children: ReactNode }): ReactNode {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!posthog_key) return;
    if (window.__posthog_initialized) return;
    posthog.init(posthog_key, { api_host: posthog_host });
    window.__posthog_initialized = true;
  }, []);

  if (!posthog_key) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogPageView(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && posthog_key) {
      posthog.capture("$pageview");
    }
  }, [pathname]);

  return null;
}
