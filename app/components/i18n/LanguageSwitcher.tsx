'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/context/i18n/navigation';
import { locales, localeNames, type Locale } from '@/context/i18n/config';

export function LanguageSwitcher() {
    const t = useTranslations('common');
    const currentLocale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();

    function changeLocale(newLocale: Locale): void {
        router.replace(
            { pathname },
            { locale: newLocale }
        );
    }

    return (
        <div className="relative inline-block">
            <select
                value={currentLocale}
                onChange={(e) => changeLocale(e.target.value as Locale)}
                className="appearance-none bg-transparent border border-white/20 rounded-lg px-3 py-1.5 pr-10 min-w-[130px] text-sm cursor-pointer hover:border-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label={t('selectLanguage')}
            >
                {locales.map((loc) => (
                    <option key={loc} value={loc} className="bg-gray-900 text-white">
                        {localeNames[loc]}
                    </option>
                ))}
            </select>
            <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    );
}
