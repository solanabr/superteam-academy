import { GoogleAnalytics } from "@next/third-parties/google";

// Google Analytics 4
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function ThirdPartyScripts() {
    return (
        <>
            {/* Google Analytics 4 */}
            {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
        </>
    );
}

// Helper for Custom Events
export function sendGAEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, params);
    }
}
