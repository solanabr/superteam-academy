import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./constants";

export const routing = defineRouting({
	locales: locales.map((l) => l.code),
	defaultLocale,
	localeDetection: true,
	localePrefix: "as-needed",
});
