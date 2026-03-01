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
