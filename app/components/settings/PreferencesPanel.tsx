'use client';

/**
 * Preferences panel — language and theme toggles.
 * Theme toggle syncs with the ThemeToggle component via
 * the same classList + localStorage pattern.
 */

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Languages, Moon, Sun, Check } from 'lucide-react';
import { goeyToast } from 'goey-toast';

export function PreferencesPanel() {
    const t = useTranslations('settings');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Read current theme from DOM on mount + listen for changes from other components
    const syncTheme = useCallback(() => {
        const hasDark = document.documentElement.classList.contains('dark');
        setTheme(hasDark ? 'dark' : 'light');
    }, []);

    useEffect(() => {
        syncTheme();
        // Listen for theme changes from ThemeToggle or other components
        window.addEventListener('storage', syncTheme);
        // Also listen for class changes via a MutationObserver
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            window.removeEventListener('storage', syncTheme);
            observer.disconnect();
        };
    }, [syncTheme]);

    const handleThemeChange = (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
        goeyToast.success(`Switched to ${newTheme} mode`);
    };

    const handleLanguageChange = (newLocale: string) => {
        const segments = pathname.split('/');
        segments[1] = newLocale;
        router.push(segments.join('/'));
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'pt-BR', label: 'Portugues' },
        { code: 'es', label: 'Espanol' },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Language */}
            <div>
                <label className="text-sm font-semibold font-supreme text-foreground mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-brand-green-emerald" />
                    {t('preferences.language')}
                </label>
                <div className="flex gap-2 flex-wrap">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-supreme transition-all border ${locale === lang.code
                                ? 'bg-brand-green-emerald text-white border-brand-green-emerald shadow-md'
                                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-brand-green-emerald/50'
                                }`}
                        >
                            {locale === lang.code && <Check className="w-3.5 h-3.5" />}
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme */}
            <div>
                <label className="text-sm font-semibold font-supreme text-foreground mb-3 flex items-center gap-2">
                    {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-brand-green-emerald" />
                    ) : (
                        <Sun className="w-4 h-4 text-brand-green-emerald" />
                    )}
                    {t('preferences.theme')}
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-supreme transition-all border ${theme === 'dark'
                            ? 'bg-brand-green-emerald text-white border-brand-green-emerald shadow-md'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-brand-green-emerald/50'
                            }`}
                    >
                        <Moon className="w-3.5 h-3.5" />
                        Dark
                    </button>
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-supreme transition-all border ${theme === 'light'
                            ? 'bg-brand-green-emerald text-white border-brand-green-emerald shadow-md'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-brand-green-emerald/50'
                            }`}
                    >
                        <Sun className="w-3.5 h-3.5" />
                        Light
                    </button>
                </div>
            </div>
        </div>
    );
}
