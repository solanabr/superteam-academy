"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { GlobeSimple, Check } from "@phosphor-icons/react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: Locale) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border-[2.5px] border-border bg-card text-text-2 transition-colors after:absolute after:-inset-1 after:content-[''] hover:bg-subtle hover:text-text md:after:hidden"
          aria-label={`Language: ${localeNames[locale as Locale]}`}
        >
          <GlobeSimple size={16} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[201]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleChange(loc)}
            className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 font-display text-[13px] font-semibold md:min-h-0"
          >
            <span>{localeNames[loc]}</span>
            {locale === loc && (
              <Check size={14} weight="bold" className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
