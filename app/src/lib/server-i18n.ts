import { cookies } from "next/headers"
import { DEFAULT_LOCALE, isAppLocale } from "@/lib/locale"
import { getFallbackMessages, getMessages } from "@/lib/messages"

function resolvePath(messageMap: Record<string, unknown>, key: string): string | null {
  const segments = key.split(".")
  let current: unknown = messageMap

  for (const segment of segments) {
    if (typeof current !== "object" || current == null) return null
    current = (current as Record<string, unknown>)[segment]
  }

  return typeof current === "string" ? current : null
}

export async function getServerI18n() {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("locale")?.value
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  const messages = getMessages(locale)
  const fallbackMessages = getFallbackMessages()

  const t = (key: string, fallback: string) =>
    resolvePath(messages, key) ?? resolvePath(fallbackMessages, key) ?? fallback

  return { locale, t }
}
