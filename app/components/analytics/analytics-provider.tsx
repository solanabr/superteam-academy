"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // PostHog init
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    import("posthog-js").then((mod) => {
      const posthog = mod.default;
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_KEY, {
          api_host: "https://us.i.posthog.com",
          capture_pageview: false,
        });
      }
    });
  }, []);

  // Page view tracking
  useEffect(() => {
    if (GA_ID && typeof window !== "undefined") {
      window.gtag?.("config", GA_ID, { page_path: pathname });
    }
    if (POSTHOG_KEY && typeof window !== "undefined") {
      window.posthog?.capture("$pageview");
    }
  }, [pathname]);

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {children}
    </>
  );
}
