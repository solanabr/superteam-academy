'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useTransition } from 'react';

interface LanguageOption {
  locale: Locale;
  label: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { locale: 'en', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { locale: 'pt', label: 'Portugu\u00EAs', flag: '\u{1F1E7}\u{1F1F7}' },
  { locale: 'es', label: 'Espa\u00F1ol', flag: '\u{1F1EA}\u{1F1F8}' },
  { locale: 'hi', label: '\u0939\u093F\u0928\u094D\u0926\u0940', flag: '\u{1F1EE}\u{1F1F3}' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentLanguage = languages.find((lang) => lang.locale === locale);

  function handleLocaleChange(nextLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">
            {currentLanguage?.label ?? 'Language'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.locale}
            onClick={() => handleLocaleChange(lang.locale)}
            className={locale === lang.locale ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-base" aria-hidden="true">
              {lang.flag}
            </span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
