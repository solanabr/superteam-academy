import { getRequestConfig } from "next-intl/server";

// Supported locales with metadata
export const locales = [
	{
		code: "en",
		name: "English",
		flag: "🇺🇸",
		direction: "ltr" as "ltr" | "rtl",
	},
	{
		code: "pt-BR",
		name: "Português (Brasil)",
		flag: "🇧🇷",
		direction: "ltr" as "ltr" | "rtl",
	},
	{
		code: "es",
		name: "Español",
		flag: "🇪🇸",
		direction: "ltr" as "ltr" | "rtl",
	},
] as const;

export type Locale = (typeof locales)[number]["code"];
export type LocaleDirection = (typeof locales)[number]["direction"];

export const defaultLocale: Locale = "en";

// Locale detection and routing configuration
export const localeConfig = {
	locales: locales.map((l) => l.code),
	defaultLocale,
	localeDetection: true,
	localePrefix: "as-needed" as const,
};

// Get locale metadata
export function getLocaleInfo(locale: string) {
	return locales.find((l) => l.code === locale);
}

// Check if locale is RTL
export function isRTL(locale: string): boolean {
	const info = getLocaleInfo(locale);
	return info?.direction === "rtl";
}

// Get locale direction
export function getLocaleDirection(locale: string): LocaleDirection {
	const info = getLocaleInfo(locale);
	return info?.direction || "ltr";
}

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
export default getRequestConfig(async ({ locale = "en" }) => ({
	locale,
	messages: await translationConfig.loadTranslations(locale as Locale),
}));
