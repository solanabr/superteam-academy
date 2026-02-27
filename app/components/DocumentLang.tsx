'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';

const localeToLang: Record<string, string> = {
  en: 'en',
  pt: 'pt',
  es: 'es',
};

export function DocumentLang() {
  const { locale } = useI18n();

  useEffect(() => {
    const lang = localeToLang[locale] ?? 'en';
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [locale]);

  return null;
}
