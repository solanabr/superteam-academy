'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LOCALES = [
  { value: 'en', label: 'EN' },
  { value: 'pt-BR', label: 'PT' },
  { value: 'es', label: 'ES' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onValueChange(value: string) {
    router.replace(pathname || '/', { locale: value as 'en' | 'pt-BR' | 'es' });
  }

  return (
    <Select value={locale} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-[72px] shrink-0 rounded-lg border-border bg-transparent text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[72px]">
        {LOCALES.map((l) => (
          <SelectItem key={l.value} value={l.value} className="text-sm">
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
