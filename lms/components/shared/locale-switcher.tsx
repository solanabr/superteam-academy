"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlagUS, FlagBR, FlagES, FlagIN } from "@/components/shared/flags";
import type { Locale } from "@/i18n/routing";

const LOCALES: { value: Locale; label: string; flag: React.ComponentType<{ className?: string }> }[] = [
  { value: "en", label: "English", flag: FlagUS },
  { value: "pt-BR", label: "Português", flag: FlagBR },
  { value: "es", label: "Español", flag: FlagES },
  { value: "hi", label: "हिन्दी", flag: FlagIN },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  const handleSelect = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <current.flag className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => handleSelect(l.value)}
            className={locale === l.value ? "bg-accent text-accent-foreground font-medium" : ""}
          >
            <l.flag className="h-4 w-5" />
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
