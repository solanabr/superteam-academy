'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { value: 'en', label: 'EN' },
  { value: 'pt-BR', label: 'PT' },
  { value: 'es', label: 'ES' },
];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale =
    languages.find((l) => pathname.startsWith(`/${l.value}`))?.value || 'en';

  const handleChange = (newLocale: string) => {
    // Remove current locale prefix and add new one
    const segments = pathname.split('/');
    const hasLocale = languages.some((l) => l.value === segments[1]);
    const pathWithoutLocale = hasLocale
      ? '/' + segments.slice(2).join('/')
      : pathname;
    const newPath =
      newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <Select value={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[72px] h-9" aria-label="Language">
        <Globe className="h-3.5 w-3.5 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
