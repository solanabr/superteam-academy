'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations, useLocale } from 'next-intl';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  GraduationCap,
  Moon,
  Sun,
  Menu,
  X,
  Trophy,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'pt-BR', label: 'PT', flag: '🇧🇷' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
] as const;

const NAV_ITEMS = [
  { key: 'courses', path: '/cursos', enPath: '/courses', esPath: '/cursos' as const, icon: BookOpen },
  { key: 'dashboard', path: '/painel', enPath: '/dashboard', esPath: '/panel' as const, icon: LayoutDashboard },
  { key: 'leaderboard', path: '/classificacao', enPath: '/leaderboard', esPath: '/clasificacion' as const, icon: Trophy },
] as const;

type LocaleCode = 'pt-BR' | 'en' | 'es';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale() as LocaleCode;

  function getNavPath(item: typeof NAV_ITEMS[number]): string {
    if (locale === 'en') return `/${locale}${item.enPath}`;
    if (locale === 'es') return `/${locale}${item.esPath}`;
    return `/${locale}${item.path}`;
  }

  function isActive(item: typeof NAV_ITEMS[number]): boolean {
    return (
      pathname.includes(item.path.slice(1)) ||
      pathname.includes(item.enPath.slice(1)) ||
      pathname.includes(item.esPath.slice(1))
    );
  }

  function switchLocale(newLocale: string) {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">
              Superteam <span className="text-purple-400">Academy</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const href = getNavPath(item);
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.key as 'courses' | 'dashboard' | 'leaderboard')}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-900 rounded-lg p-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => switchLocale(loc.code)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    locale === loc.code
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  )}
                  aria-label={`Switch to ${loc.label}`}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.label}</span>
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Wallet button */}
            <div className="hidden sm:block">
              <WalletMultiButton
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  height: '2.25rem',
                }}
              />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:bg-gray-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const href = getNavPath(item);
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-purple-900/50 text-purple-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.key as 'courses' | 'dashboard' | 'leaderboard')}
              </Link>
            );
          })}

          {/* Mobile language switcher */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => {
                  switchLocale(loc.code);
                  setMobileOpen(false);
                }}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  locale === loc.code
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                )}
              >
                <span>{loc.flag}</span>
                <span>{loc.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile wallet */}
          <div className="pt-1 pb-2">
            <WalletMultiButton
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                width: '100%',
                height: '2.5rem',
              }}
            />
          </div>
        </div>
      )}
    </nav>
  );
}
