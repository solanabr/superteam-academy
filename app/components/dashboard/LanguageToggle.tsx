/**
 * LanguageToggle — Dropdown language switcher with Languages icon and current locale label.
 * Reusable across navbar, topbar, settings.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/context/i18n/navigation';
import { locales, localeNames, type Locale } from '@/context/i18n/config';

/** Short labels for the topbar button */
const SHORT_LABELS: Record<Locale, string> = {
    en: 'EN',
    'pt-BR': 'PT',
    es: 'ES',
};

export function LanguageToggle() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const currentLocale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();

    function switchLocale(locale: Locale) {
        router.replace(
            { pathname },
            { locale, scroll: false }
        );
        setOpen(false);
    }

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                aria-label="Switch language"
                className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
                <Languages className="w-4 h-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground font-supreme">
                    {SHORT_LABELS[currentLocale]}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden">
                    {locales.map((locale) => (
                        <button
                            key={locale}
                            onClick={() => switchLocale(locale)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${locale === currentLocale
                                ? 'bg-accent text-accent-foreground font-semibold'
                                : 'text-foreground hover:bg-muted'
                                }`}
                        >
                            {localeNames[locale]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
