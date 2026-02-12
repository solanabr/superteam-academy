'use client';

import { useTransition } from 'react';
import { locales, getLocaleName, getLocaleFlag, type Locale } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(locale: Locale) {
    startTransition(() => {
      document.cookie = `locale=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <div className="relative group">
      <Button variant="ghost" size="icon" disabled={isPending}>
        <Globe className="h-4 w-4" />
      </Button>
      <div className="absolute right-0 top-full z-50 hidden w-40 rounded-md border bg-popover p-1 shadow-md group-hover:block">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="flex w-full items-center space-x-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          >
            <span>{getLocaleFlag(locale)}</span>
            <span>{getLocaleName(locale)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
