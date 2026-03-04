export const locales = ["en", "pt-BR", "es"] as const
export const defaultLocale = "en" as const
export type Locale = (typeof locales)[number]
