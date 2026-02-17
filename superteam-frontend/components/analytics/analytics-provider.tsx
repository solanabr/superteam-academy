"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { gtagScriptUrl, gtagInitScript } from "@/lib/analytics/gtag";
import { getPostHogClient } from "@/lib/analytics/posthog";
import { analytics } from "@/lib/analytics";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    getPostHogClient();
  }, []);

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname]);

  const scriptUrl = gtagScriptUrl();
  const initScript = gtagInitScript();

  return (
    <>
      {scriptUrl && <Script src={scriptUrl} strategy="afterInteractive" />}
      {initScript && (
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: initScript }}
        />
      )}
      {children}
    </>
  );
}
