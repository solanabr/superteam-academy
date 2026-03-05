'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/config';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleChange(l)}
        >
          {l === 'pt-BR' ? 'PT' : l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
