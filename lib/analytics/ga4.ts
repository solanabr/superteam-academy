export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Log the pageview with a URL
export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('config', GA_TRACKING_ID, {
            page_path: url,
        });
    }
};

// Log specific events
export const event = (
    action: string,
    params?: Record<string, string | number | boolean>
) => {
    if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
        window.gtag('event', action, params);
    }
};
