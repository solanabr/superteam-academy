import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./constants";

export const routing = defineRouting({
	// A list of all locales that are supported
	locales: locales.map((l) => l.code),

	// Used when no locale matches
	defaultLocale,

	// Automatically detect the user's locale based on:
	// 1. The `Accept-Language` header
	// 2. A cookie named `NEXT_LOCALE`
	// 3. The pathname
	localeDetection: true,

	// The locale prefix can be:
	// - 'as-needed': Only add the locale prefix when needed (e.g., when the default locale is not used)
	// - 'always': Always add the locale prefix
	// - 'never': Never add the locale prefix
	localePrefix: "as-needed",
});
