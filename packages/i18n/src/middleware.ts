import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

/**
 * Next.js internationalization middleware
 *
 * This middleware handles:
 * - Locale detection and routing
 * - URL path rewriting for localized routes
 * - Redirecting to appropriate locale
 *
 * Configuration:
 * - Supported locales: en, pt-BR, es
 * - Default locale: en
 * - Locale prefix strategy: always (except for default locale)
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
	// Match all pathnames except for
	// - /api (API routes)
	// - /_next (Next.js internals)
	// - /_vercel (Vercel internals)
	// - /favicon.ico, /sitemap.xml, /robots.txt (static files)
	matcher: [
		"/",
		"/(en|pt-BR|es)/:path*",
		"/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
