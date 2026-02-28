import { getTranslations } from "next-intl/server";
import { locales } from "./config";

function buildMetadata(
	title: string,
	description: string | undefined,
	locale: string,
	canonical: string,
	ogType = "website"
) {
	return {
		title,
		description,
		openGraph: { title, description, locale, type: ogType },
		twitter: { card: "summary_large_image" as const, title, description },
		alternates: {
			canonical,
			languages: locales.reduce(
				(acc, loc) => {
					acc[loc.code] = canonical.replace(`/${locale}`, `/${loc.code}`);
					return acc;
				},
				{} as Record<string, string>
			),
		},
	};
}

export async function generatePageMetadata(
	locale: string,
	namespace: string,
	titleKey: string,
	descriptionKey?: string
) {
	const t = await getTranslations({ locale, namespace });
	return buildMetadata(
		t(titleKey),
		descriptionKey ? t(descriptionKey) : undefined,
		locale,
		`/${locale}`
	);
}

export async function generateCourseMetadata(
	locale: string,
	courseId: string,
	courseTitle: string
) {
	const t = await getTranslations({ locale, namespace: "courses" });
	return buildMetadata(
		`${courseTitle} - ${t("title")}`,
		t("courseDescription", { course: courseTitle }),
		locale,
		`/${locale}/courses/${courseId}`,
		"article"
	);
}

export async function generateProfileMetadata(locale: string, username: string) {
	const t = await getTranslations({ locale, namespace: "profile" });
	return buildMetadata(
		`${username} - ${t("title")}`,
		t("profileDescription", { user: username }),
		locale,
		`/${locale}/profile/${username}`,
		"profile"
	);
}

const translationCache = new Map<string, unknown>();

export const ServerTranslationLoader = {
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

	async preloadCommonTranslations(): Promise<void> {
		const commonNamespaces = ["common", "navigation", "auth", "errors"];

		const preloadPromises = locales.flatMap((locale) =>
			commonNamespaces.map((namespace) =>
				ServerTranslationLoader.loadTranslations(locale.code, namespace)
			)
		);

		await Promise.all(preloadPromises);
	},

	clearCache(): void {
		translationCache.clear();
	},

	getCacheStats(): { size: number; keys: string[] } {
		return {
			size: translationCache.size,
			keys: Array.from(translationCache.keys()),
		};
	},
};

export async function createTranslationContext(locale: string) {
	const commonT = await getTranslations({ locale, namespace: "common" });
	const navT = await getTranslations({ locale, namespace: "navigation" });
	const authT = await getTranslations({ locale, namespace: "auth" });

	return {
		locale,
		common: commonT,
		navigation: navT,
		auth: authT,
	};
}

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
