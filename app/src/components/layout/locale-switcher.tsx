"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const locales = [
  { code: "en" as const, label: "English", flag: "EN" },
  { code: "pt-BR" as const, label: "Portugues", flag: "BR" },
  { code: "es" as const, label: "Espanol", flag: "ES" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  const handleLocaleChange = (code: "en" | "pt-BR" | "es") => {
    router.replace(pathname, { locale: code });
    // Persist to DB (fire-and-forget, works only when logged in)
    fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage: code }),
    }).catch(() => {});
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLocaleChange(l.code)}
            className={locale === l.code ? "bg-accent" : ""}
          >
            <span className="mr-2 text-sm font-medium">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
