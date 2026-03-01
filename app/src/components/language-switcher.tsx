"use client";

import { useLocale } from 'next-intl';
// ИСПОЛЬЗУЕМ УМНЫЕ ХУКИ
import { useRouter, usePathname } from '@/i18n/navigation'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Умный роутер сам подставит нужную локаль!
    // @ts-ignore - next-intl ожидает типы, но для хакатона игнорим
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[110px] h-9 bg-background" aria-label="Select language">
        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
        {/* Добавим проверку, чтобы не было пустты */}
        <SelectValue placeholder="Lang">{locale.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="pt-BR">Português</SelectItem>
      </SelectContent>
    </Select>
  );
}