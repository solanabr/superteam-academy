'use client';

import { useI18n } from '@/lib/i18n/context';
import { localeNames, type Locale } from '@/lib/i18n/messages';

const LOCALES: Locale[] = ['en', 'pt', 'es'];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative">
      <label htmlFor="lang-select" className="sr-only">
        Language
      </label>
      <select
        id="lang-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-md border border-border/60 bg-surface px-2 py-1.5 text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="Select language"
      >
        {LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
