'use client';

import { useI18n } from '@/components/i18n/i18n-provider';
import { Locale } from '@/lib/types';

const options: Array<{ value: Locale; label: string; title: string }> = [
  { value: 'pt-BR', label: 'PT', title: 'Portugues (Brasil)' },
  { value: 'es', label: 'ES', title: 'Espanol' },
  { value: 'en', label: 'EN', title: 'English' }
];

export function LanguageSwitcher(): JSX.Element {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-grid grid-cols-3 items-center gap-1 rounded-2xl border border-border/70 bg-card/75 p-1 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => setLocale(option.value)}
          className={
            locale === option.value
              ? 'h-8 min-w-[3rem] rounded-xl bg-primary px-2 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm'
              : 'h-8 min-w-[3rem] rounded-xl px-2 text-[11px] font-bold uppercase tracking-wide text-foreground/75 transition hover:bg-muted/80 hover:text-foreground'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
