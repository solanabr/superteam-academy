'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/context/i18n/navigation';
import { locales, localeNames, type Locale } from '@/context/i18n/config';

interface LandingNavbarProps {
    /** Hide nav links and CTA — show only logo, language, theme toggle */
    minimal?: boolean;
}

export function LandingNavbar({ minimal = false }: LandingNavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const currentLocale = useLocale() as Locale;
    const t = useTranslations('nav');
    const router = useRouter();
    const pathname = usePathname();

    /* ── Theme toggle ────────────────────────────── */

    function toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
        }
    }

    /* ── Language switch ──────────────────────────── */
    function switchLocale(locale: Locale) {
        const scrollY = window.scrollY;
        sessionStorage.setItem('__locale_scroll', String(scrollY));
        router.replace(
            { pathname },
            { locale, scroll: false }
        );
        setLangOpen(false);
    }

    /* ── Restore scroll after locale switch ────────── */
    useEffect(() => {
        const saved = sessionStorage.getItem('__locale_scroll');
        if (saved) {
            sessionStorage.removeItem('__locale_scroll');
            const y = Number(saved);
            requestAnimationFrame(() => window.scrollTo(0, y));
        }
    }, []);

    /* ── Close dropdowns on outside click ─────────── */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const langFlag: Record<Locale, string> = { en: '🇺🇸', 'pt-BR': '🇧🇷', es: '🇪🇸' };

    return (
        <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-[1440px]">
            <div className="flex h-14 items-center justify-between rounded-2xl bg-background px-4 shadow-lg ring-1 ring-border sm:px-6">
                {/* ── Logo ── */}
                <Link href="/" className="flex shrink-0 items-center">
                    {/* Desktop: horizontal logo */}
                    <Image
                        src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-EMERALD-GREEN-HORIZONTAL.png"
                        alt="Superteam Academy"
                        width={384}
                        height={66}
                        className="hidden h-7 w-auto sm:block dark:hidden"
                        priority
                    />
                    <Image
                        src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png"
                        alt="Superteam Academy"
                        width={384}
                        height={66}
                        className="hidden h-7 w-auto sm:dark:block"
                        priority
                    />
                    {/* Mobile: icon only */}
                    <Image
                        src="/superteams-brandkit/Logo/VERTICAL/ST-EMERALD-GREEN-VERTICAL.png"
                        alt="Superteam Academy"
                        width={36}
                        height={36}
                        className="h-9 w-9 sm:hidden dark:hidden"
                        priority
                    />
                    <Image
                        src="/superteams-brandkit/Logo/VERTICAL/ST-OFF-WHITE-VERTICAL.png"
                        alt="Superteam Academy"
                        width={36}
                        height={36}
                        className="hidden h-9 w-9 dark:block sm:dark:hidden"
                        priority
                    />
                </Link>

                {/* ── Right section ── */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Home link — shown only in minimal mode (login/onboarding) */}
                    {minimal && (
                        <Link
                            href="/"
                            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-transparent hover:underline hover:underline-offset-4 sm:block"
                        >
                            {t('home')}
                        </Link>
                    )}

                    {/* Course link — hidden on mobile and in minimal mode */}
                    {!minimal && (
                        <a
                            href="#courses"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-transparent hover:underline hover:underline-offset-4 sm:block"
                        >
                            {t('courses')}
                        </a>
                    )}

                    {/* Language dropdown — hidden on mobile */}
                    <div ref={langRef} className="relative hidden sm:block">
                        <button
                            onClick={() => setLangOpen(!langOpen)}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-foreground transition-all hover:bg-transparent hover:underline hover:underline-offset-4"
                        >
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-xs uppercase leading-none opacity-80">{currentLocale === 'pt-BR' ? 'BR' : currentLocale}</span>
                                <span className="text-left font-semibold leading-none">{localeNames[currentLocale]}</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform opacity-70 ${langOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {langOpen && (
                            <div className="absolute right-0 top-full mt-2 w-[110px] overflow-hidden rounded-xl bg-background shadow-lg ring-1 ring-border">
                                {locales.map((loc) => (
                                    <button
                                        key={loc}
                                        onClick={() => switchLocale(loc)}
                                        className={`flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-left text-xs transition-all hover:bg-transparent hover:underline hover:underline-offset-4 ${loc === currentLocale ? 'text-accent' : 'text-foreground'}`}
                                    >
                                        <span className="text-[10px] uppercase opacity-70">{loc === 'pt-BR' ? 'BR' : loc}</span>
                                        <span className="font-semibold">{localeNames[loc]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dark / Light toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
                        aria-label="Toggle theme"
                    >
                        {/* Sun icon (shown in dark mode) */}
                        <svg className="hidden h-[18px] w-[18px] dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                        {/* Moon icon (shown in light mode) */}
                        <svg className="block h-[18px] w-[18px] dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </button>

                    {!minimal && (
                        <Link
                            href="/login"
                            className="hidden rounded-xl bg-brand-black px-4 py-2 text-sm font-semibold text-brand-cream transition-colors hover:bg-brand-green-dark sm:block dark:bg-brand-cream dark:text-brand-black dark:hover:bg-brand-yellow"
                        >
                            {t('getStarted')}
                        </Link>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted sm:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <span className={`absolute block h-[2px] w-5 bg-current transition-all duration-300 ease-out ${mobileOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
                            <span className={`absolute block h-[2px] w-5 bg-current transition-all duration-300 ease-out ${mobileOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                            <span className={`absolute block h-[2px] w-5 bg-current transition-all duration-300 ease-out ${mobileOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
                        </div>
                    </button>
                </div>
            </div>

            {/* ── Mobile menu ── */}
            <div
                className={`grid transition-all duration-300 ease-in-out sm:hidden ${mobileOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="mt-2 rounded-2xl border border-border/50 bg-background shadow-lg dark:border-border">
                        <div className="flex flex-col p-3">
                            {/* Home link — shown only in minimal mode (login/onboarding) */}
                            {minimal && (
                                <Link
                                    href="/"
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-transparent hover:underline hover:underline-offset-4"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {t('home')}
                                </Link>
                            )}

                            {!minimal && (
                                <a
                                    href="#courses"
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-transparent hover:underline hover:underline-offset-4"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMobileOpen(false);
                                        document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    {t('courses')}
                                </a>
                            )}

                            {/* Language options */}
                            <div className="border-t border-border my-2" />
                            <p className="px-4 pb-1 text-xs font-medium text-muted-foreground">{t('language')}</p>
                            {locales.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => { switchLocale(loc); setMobileOpen(false); }}
                                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm transition-all hover:bg-transparent hover:underline hover:underline-offset-4 ${loc === currentLocale ? 'text-accent' : 'text-foreground'}`}
                                >
                                    <span className="text-xs uppercase opacity-80">{loc === 'pt-BR' ? 'BR' : loc}</span>
                                    <span className="font-semibold">{localeNames[loc]}</span>
                                </button>
                            ))}

                            {!minimal && (
                                <>
                                    <div className="border-t border-border my-2" />
                                    <Link
                                        href="/login"
                                        className="rounded-xl bg-brand-black px-4 py-2.5 text-center text-sm font-semibold text-brand-cream dark:bg-brand-cream dark:text-brand-black"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {t('getStarted')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
