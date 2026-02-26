"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocaleCookie } from "@/app/actions/locale";
import type { Locale } from "@/i18n/request";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português" },
  { value: "es", label: "Español" },
];

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    startTransition(async () => {
      await setLocaleCookie(newLocale);
      router.refresh();
    });
  };

  return (
    <Select
      value={locale}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[130px] gap-2 font-game" aria-label="Select language">
        <Languages className="h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
