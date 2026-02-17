import { getTranslations } from "next-intl/server";
import { locales } from "./config";

/**
 * Server-side rendering utilities for translations
 * Provides utilities for generating metadata, handling SSR translations
 */

/**
 * Generate page metadata with translations
 */
export async function generatePageMetadata(
	locale: string,
	namespace: string,
	titleKey: string,
	descriptionKey?: string
) {
	const t = await getTranslations({ locale, namespace });

	const title = t(titleKey);
	const description = descriptionKey ? t(descriptionKey) : undefined;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			locale,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
		alternates: {
			canonical: `/${locale}`,
			languages: locales.reduce(
				(acc, loc) => {
					acc[loc.code] = `/${loc.code}`;
					return acc;
				},
				{} as Record<string, string>
			),
		},
	};
}

/**
 * Generate course metadata
 */
export async function generateCourseMetadata(
	locale: string,
	courseId: string,
	courseTitle: string
) {
	const t = await getTranslations({ locale, namespace: "courses" });

	const title = `${courseTitle} - ${t("title")}`;
	const description = t("courseDescription", { course: courseTitle });

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "article",
			locale,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
		alternates: {
			canonical: `/${locale}/courses/${courseId}`,
			languages: locales.reduce(
				(acc, loc) => {
					acc[loc.code] = `/${loc.code}/courses/${courseId}`;
					return acc;
				},
				{} as Record<string, string>
			),
		},
	};
}

/**
 * Generate profile metadata
 */
export async function generateProfileMetadata(locale: string, username: string) {
	const t = await getTranslations({ locale, namespace: "profile" });

	const title = `${username} - ${t("title")}`;
	const description = t("profileDescription", { user: username });

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "profile",
			locale,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
		alternates: {
			canonical: `/${locale}/profile/${username}`,
			languages: locales.reduce(
				(acc, loc) => {
					acc[loc.code] = `/${loc.code}/profile/${username}`;
					return acc;
				},
				{} as Record<string, string>
			),
		},
	};
}

/**
 * Server-side translation loader
 * Pre-loads translations for SSR
 */
const translationCache = new Map<string, unknown>();

export const ServerTranslationLoader = {
	/**
	 * Load translations for a specific locale and namespace
	 */
	async loadTranslations(locale: string, namespace?: string): Promise<unknown> {
		const cacheKey = `${locale}${namespace ? `:${namespace}` : ""}`;

		if (translationCache.has(cacheKey)) {
			return translationCache.get(cacheKey);
		}

		try {
			const t = await getTranslations(
				namespace !== undefined ? { locale, namespace } : { locale }
			);
			const translations = namespace ? { [namespace]: t } : t;

			translationCache.set(cacheKey, translations);
			return translations;
		} catch (error) {
			console.error(
				`Failed to load translations for ${locale}${namespace ? `:${namespace}` : ""}:`,
				error
			);
			return {};
		}
	},

	/**
	 * Pre-load common translations for better performance
	 */
	async preloadCommonTranslations(): Promise<void> {
		const commonNamespaces = ["common", "navigation", "auth", "errors"];

		const preloadPromises = locales.flatMap((locale) =>
			commonNamespaces.map((namespace) =>
				ServerTranslationLoader.loadTranslations(locale.code, namespace)
			)
		);

		await Promise.all(preloadPromises);
	},

	/**
	 * Clear translation cache
	 */
	clearCache(): void {
		translationCache.clear();
	},

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; keys: string[] } {
		return {
			size: translationCache.size,
			keys: Array.from(translationCache.keys()),
		};
	},
};

/**
 * Translation context provider for server components
 * Provides translation utilities to child components
 */
export async function createTranslationContext(locale: string) {
	const commonT = await getTranslations({ locale, namespace: "common" });
	const navT = await getTranslations({ locale, namespace: "navigation" });
	const authT = await getTranslations({ locale, namespace: "auth" });

	return {
		locale,
		common: commonT,
		navigation: navT,
		auth: authT,
		// Add more namespaces as needed
	};
}

/**
 * Generate sitemap URLs with locale support
 */
export function generateSitemapUrls(
	baseUrl: string,
	paths: string[]
): Array<{ url: string; lastModified: Date; changeFrequency: string; priority: number }> {
	const urls: Array<{
		url: string;
		lastModified: Date;
		changeFrequency: string;
		priority: number;
	}> = [];

	for (const locale of locales) {
		for (const path of paths) {
			urls.push({
				url: `${baseUrl}/${locale.code}${path}`,
				lastModified: new Date(),
				changeFrequency: path === "/" ? "daily" : "weekly",
				priority: path === "/" ? 1.0 : 0.8,
			});
		}
	}

	return urls;
}

/**
 * Generate robots.txt content with locale support
 */
export function generateRobotsTxt(baseUrl: string): string {
	let content = `User-agent: *
Allow: /

# Sitemaps
`;

	for (const locale of locales) {
		content += `Sitemap: ${baseUrl}/${locale.code}/sitemap.xml\n`;
	}

	return content;
}

/**
 * Translation error boundary helper
 * Provides fallback translations when translation loading fails
 */
const errorFallbacks = {
	en: {
		error: "An error occurred",
		loading: "Loading...",
		notFound: "Page not found",
	},
	"pt-BR": {
		error: "Ocorreu um erro",
		loading: "Carregando...",
		notFound: "Página não encontrada",
	},
	es: {
		error: "Ocurrió un error",
		loading: "Cargando...",
		notFound: "Página no encontrada",
	},
};

export const TranslationErrorBoundary = {
	getFallback(locale: string, key: string): string {
		const localeFallbacks =
			errorFallbacks[locale as keyof typeof errorFallbacks] || errorFallbacks.en;
		return (
			localeFallbacks[key as keyof typeof localeFallbacks] ||
			errorFallbacks.en[key as keyof typeof errorFallbacks.en] ||
			key
		);
	},

	async safeTranslate(
		getTranslationsFn: () => Promise<unknown>,
		key: string,
		locale: string,
		options?: unknown
	): Promise<string> {
		try {
			const t = (await getTranslationsFn()) as (key: string, options?: unknown) => string;
			return t(key, options);
		} catch (error) {
			console.warn(`Translation failed for key "${key}" in locale "${locale}":`, error);
			return TranslationErrorBoundary.getFallback(locale, key);
		}
	},
};
