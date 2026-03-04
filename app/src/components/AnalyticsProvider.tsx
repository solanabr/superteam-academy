"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { initAnalytics, track } from "@/lib/analytics";

const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

  return ga4Id ? (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js', new Date());gtag('config', '${ga4Id}');`}
      </Script>
    </>
  ) : null;
}
