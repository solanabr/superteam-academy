import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	// A list of all locales that are supported
	locales: [
		"en",
		"de",
		"es",
		"fr",
		"hi",
		"id",
		"it",
		"ja",
		"ko",
		"ne",
		"pt-br",
		"ru",
		"tr",
		"vi",
		"zh",
	],

	// Used when no locale matches
	defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } =
	createNavigation(routing);
