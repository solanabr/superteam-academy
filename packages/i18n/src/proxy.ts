import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

export default createMiddleware({
	locales: locales.map((l) => l.code),

	defaultLocale,

	localeDetection: true,

	// 'always' - always show locale prefix
	// 'as-needed' - only show when not default locale
	// 'never' - never show locale prefix
	localePrefix: "as-needed",
});

export const config = {
	matcher: [
		// - … if they start with `/api`,  `/_next` or `/_vercel`
		// - … the ones containing a dot (e.g. `favicon.ico`)
		"/((?!api|_next|_vercel|.*\\.).*)",
	],
};
