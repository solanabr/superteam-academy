import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./constants";

export * from "./constants";

// Translation loading configuration
export const translationConfig = {
	// Load translations from JSON files
	loadTranslations: async (locale: Locale) => {
		try {
			const translations = await import(`../locales/${locale}.json`);
			return translations.default;
		} catch (error) {
			console.warn(`Failed to load translations for ${locale}:`, error);
			// Fallback to English
			if (locale !== "en") {
				return import("../locales/en.json").then((m) => m.default);
			}
			throw error;
		}
	},
};

// Next-intl request configuration
export default getRequestConfig(async ({ requestLocale }) => {
	// This typically corresponds to the `[locale]` segment
	let locale = await requestLocale;

	// Ensure that a valid locale is used
	if (!locale || !routing.locales.includes(locale as Locale)) {
		locale = routing.defaultLocale;
	}

	return {
		locale,
		messages: await translationConfig.loadTranslations(locale as Locale),
	};
});
