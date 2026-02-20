"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Google Analytics 4
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Hotjar
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_SV = process.env.NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION || "6";
// Sentry
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function ThirdPartyScripts() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Track GA4 Pageviews on route change
    useEffect(() => {
        if (pathname && GA_MEASUREMENT_ID) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
            (window as any).gtag?.("config", GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);

    return (
        <>
            {/* Google Analytics 4 */}
            {GA_MEASUREMENT_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
                    </Script>
                </>
            )}

            {/* Hotjar Heatmap */}
            {HOTJAR_ID && (
                <Script id="hotjar" strategy="afterInteractive">
                    {`
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_SV}};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `}
                </Script>
            )}

            {/* Sentry */}
            {SENTRY_DSN && (
                <>
                    <Script
                        src="https://browser.sentry-cdn.com/8.54.0/bundle.min.js"
                        crossOrigin="anonymous"
                        strategy="afterInteractive"
                    />
                    <Script id="sentry-init" strategy="afterInteractive">
                        {`
              window.Sentry?.init({
                dsn: '${SENTRY_DSN}',
                integrations: [],
                tracesSampleRate: 1.0,
              });
            `}
                    </Script>
                </>
            )}
        </>
    );
}

// Helper for Custom Events
export function sendGAEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, params);
    }
}
