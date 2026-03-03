import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

// Google Analytics 4
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Hotjar
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_SV = process.env.NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION || "6";

export function ThirdPartyScripts() {
    return (
        <>
            {/* Google Analytics 4 */}
            {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}

            {/* Hotjar Heatmap */}
            {HOTJAR_ID && (
                <Script id="hotjar" strategy="lazyOnload">
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
        </>
    );
}

// Helper for Custom Events
export function sendGAEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, params);
    }
}
