"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 — page view tracker.
 * Wrapped in Suspense because useSearchParams() requires it.
 */
function GAPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        // @ts-expect-error gtag not typed
        window.gtag?.("config", GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }, [pathname, searchParams]);

    return null;
}

/**
 * Custom GA4 event helper.
 * Usage:
 *   trackEvent("lesson_complete", { course_id: "anchor-101", lesson_index: 3 })
 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
    if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
    // @ts-expect-error gtag not typed
    window.gtag?.("event", action, params);
}

/**
 * Analytics provider component — renders GA4 scripts and page view tracker.
 * Place this inside a layout that renders on every page.
 */
export function Analytics() {
    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                    });
                `}
            </Script>
            <Suspense fallback={null}>
                <GAPageView />
            </Suspense>
        </>
    );
}
