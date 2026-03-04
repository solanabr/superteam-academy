import en from "@/messages/en.json"
import es from "@/messages/es.json"
import ptBR from "@/messages/pt-BR.json"
import { AppLocale, DEFAULT_LOCALE } from "./locale"

type MessageMap = Record<string, unknown>

const MESSAGES: Record<AppLocale, MessageMap> = {
  en,
  es,
  "pt-BR": ptBR,
}

export function getMessages(locale: AppLocale): MessageMap {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

export function getFallbackMessages(): MessageMap {
  return MESSAGES[DEFAULT_LOCALE]
}

