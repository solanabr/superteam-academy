import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

/**
 * Next.js internationalization proxy (Next.js 16+)
 *
 * This proxy handles:
 * - Locale detection and routing
 * - URL path rewriting for localized routes
 * - Redirecting to appropriate locale
 *
 * Configuration:
 * - Supported locales: en, pt-BR, es
 * - Default locale: en
 * - Locale prefix strategy: as-needed (no prefix for default locale)
 */

export default createMiddleware({
	// Supported locales from config
	locales: locales.map((l) => l.code),

	// Default locale
	defaultLocale,

	// Locale detection strategy
	localeDetection: true,

	// Pathname localization strategy
	// 'always' - always show locale prefix
	// 'as-needed' - only show when not default locale
	// 'never' - never show locale prefix
	localePrefix: "as-needed",
});

export const config = {
	// Only run proxy on routes that need i18n
	matcher: [
		// Match all pathnames except for
		// - … if they start with `/api`,  `/_next` or `/_vercel`
		// - … the ones containing a dot (e.g. `favicon.ico`)
		"/((?!api|_next|_vercel|.*\\.).*)",
	],
};
