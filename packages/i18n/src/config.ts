import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./constants";

export * from "./constants";

export const translationConfig = {
	loadTranslations: async (locale: Locale) => {
		try {
			const translations = await import(`../locales/${locale}.json`);
			return translations.default;
		} catch (error) {
			console.warn(`Failed to load translations for ${locale}:`, error);
			if (locale !== "en") {
				return import("../locales/en.json").then((m) => m.default);
			}
			throw error;
		}
	},
};

export default getRequestConfig(async ({ requestLocale }) => {
	let locale = await requestLocale;

	if (!locale || !routing.locales.includes(locale as Locale)) {
		locale = routing.defaultLocale;
	}

	return {
		locale,
		messages: await translationConfig.loadTranslations(locale as Locale),
	};
});
