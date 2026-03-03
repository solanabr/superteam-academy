/**
 * i18n Request Config — Local-First Translation Strategy
 *
 * Primary source: local JSON files in context/i18n/messages/*.json
 * Optional overlay: i18nexus API (if I18NEXUS_API_KEY is set)
 *
 * Note: i18nexus free plan has a 100-string limit. This project exceeds that
 * (~380 strings), so local JSON files are the authoritative translation source.
 * The i18nexus API is used as an optional overlay for partial overrides only.
 */
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function deepMerge(target: any, source: any) {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return source;

    const output = { ...target };
    Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    });
    return output;
}

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
        locale = routing.defaultLocale;
    }

    let messages = (await import(`./messages/${locale}.json`)).default;

    if (process.env.I18NEXUS_API_KEY) {
        try {
            const url = `https://api.i18nexus.com/project_resources/translations/${locale}.json?api_key=${process.env.I18NEXUS_API_KEY}`;
            const res = await fetch(url, { next: { revalidate: 3600 } });

            if (res.ok) {
                const apiMessages = await res.json();
                messages = deepMerge(messages, apiMessages);
            } else {
                console.error('[i18n] i18nexus API returned status:', res.status);
            }
        } catch (error) {
            console.error('[i18n] Failed to fetch from i18nexus API, using local fallback', error);
        }
    }

    return {
        locale,
        messages,
    };
});

