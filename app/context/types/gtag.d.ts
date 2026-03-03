/**
 * Type declarations for Google Analytics gtag.js.
 */

interface GtagEventParams {
    [key: string]: unknown;
}

interface Window {
    gtag: (
        command: 'config' | 'event' | 'js' | 'set',
        targetOrName: string | Date,
        params?: GtagEventParams,
    ) => void;
    dataLayer: unknown[];
}
