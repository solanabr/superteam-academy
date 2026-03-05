"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const localeLabels: Record<Locale, string> = {
    en: "English",
    "pt-BR": "Português (BR)",
    es: "Español",
};

const localeFlags: Record<Locale, string> = {
    en: "🇺🇸",
    "pt-BR": "🇧🇷",
    es: "🇪🇸",
};

export function LanguageSwitcher() {
    const locale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();

    function handleLocaleChange(newLocale: Locale) {
        router.replace(pathname, { locale: newLocale });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full transition-colors hover:bg-accent"
                >
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
                {routing.locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className={`gap-2 cursor-pointer ${loc === locale ? "bg-accent" : ""
                            }`}
                    >
                        <span className="text-base">{localeFlags[loc]}</span>
                        <span>{localeLabels[loc]}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
