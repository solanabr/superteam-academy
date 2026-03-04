"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/locale"
import { getFallbackMessages, getMessages } from "@/lib/messages"

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function resolvePath(messageMap: Record<string, unknown>, key: string): string | null {
  const segments = key.split(".")
  let current: unknown = messageMap

  for (const segment of segments) {
    if (typeof current !== "object" || current == null) return null
    current = (current as Record<string, unknown>)[segment]
  }

  return typeof current === "string" ? current : null
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode
  initialLocale?: AppLocale
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale)

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
      document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`
      document.cookie = "locale_set=1; path=/; max-age=31536000; samesite=lax"
    }
  }, [locale])

  const setLocale = useCallback((nextLocale: AppLocale) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale
      document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`
      document.cookie = "locale_set=1; path=/; max-age=31536000; samesite=lax"
    }
    setLocaleState(nextLocale)
  }, [])

  const value = useMemo<LocaleContextValue>(() => {
    const activeMessages = getMessages(locale)
    const fallbackMessages = getFallbackMessages()

    return {
      locale,
      setLocale,
      t: (key, fallback) => {
        const localized = resolvePath(activeMessages, key)
        if (localized != null) return localized
        const fallbackLocalized = resolvePath(fallbackMessages, key)
        if (fallbackLocalized != null) return fallbackLocalized
        return fallback ?? key
      },
    }
  }, [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider")
  }
  return ctx
}
