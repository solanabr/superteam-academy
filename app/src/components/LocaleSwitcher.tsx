"use client";

import { useState, useTransition } from "react";
import { Languages } from "lucide-react";

const LOCALES = [
    { code: "pt-BR", label: "PT", flag: "🇧🇷" },
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "es", label: "ES", flag: "🇪🇸" },
] as const;

export function LocaleSwitcher() {
    const [open, setOpen] = useState(false);
    const [, startTransition] = useTransition();

    function handleChange(locale: string) {
        startTransition(() => {
            document.cookie = `locale=${locale};path=/;max-age=31536000`;
            setOpen(false);
            window.location.reload();
        });
    }

    // Read current locale from cookie
    const currentLocale =
        (typeof document !== "undefined" &&
            document.cookie
                .split("; ")
                .find((c) => c.startsWith("locale="))
                ?.split("=")[1]) ||
        "pt-BR";

    const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
                <Languages className="w-[18px] h-[18px]" />
                <span>{current.flag} {current.label}</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-1 w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg z-50 overflow-hidden">
                        {LOCALES.map((locale) => (
                            <button
                                key={locale.code}
                                onClick={() => handleChange(locale.code)}
                                className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))] ${locale.code === currentLocale
                                        ? "text-[hsl(var(--primary))]"
                                        : "text-[hsl(var(--muted-foreground))]"
                                    }`}
                            >
                                <span>{locale.flag}</span>
                                <span>{locale.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
