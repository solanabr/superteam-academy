export const LOCALES = ["en", "pt-BR", "es"] as const

export type AppLocale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en"

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && LOCALES.includes(value as AppLocale))
}

