'use client'

import { createContext, useContext } from 'react'
import en from './locales/en.json'
import es from './locales/es.json'
import ptBR from './locales/pt-BR.json'

const messages: Record<string, Record<string, any>> = {
  'en': en,
  'es': es,
  'pt-BR': ptBR,
}

export const locales = ['en', 'pt-BR', 'es'] as const
export type Locale = typeof locales[number]

export const LocaleContext = createContext<Locale>('en')

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useTranslations(namespace?: string) {
  const locale = useLocale()
  const allMessages = messages[locale] || messages['en']
  
  return (key: string) => {
    if (namespace) {
      return allMessages?.[namespace]?.[key] || key
    }
    return allMessages?.[key] || key
  }
}

export function getMessages(locale: string) {
  return messages[locale] || messages['en']
}
