"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Lang } from '@/i18n/translations';
import { Menu, X, Globe, Flame, Zap, Sun, Moon } from 'lucide-react';
import { AuthModal } from '@/components/shared/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt-br', label: 'Português', flag: '🇧🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/courses', label: t('nav.courses') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
    ...(isAuthenticated ? [
      { href: '/dashboard', label: t('nav.dashboard') },
      { href: '/settings', label: 'Settings' }
    ] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-gray-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold text-sm group-hover:scale-110 transition-transform">
                ST
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-lg hidden sm:block">
                Super<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-yellow-400 dark:from-green-400 dark:to-yellow-300">team</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-gray-800'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* User stats */}
              {isAuthenticated && user && (
                <div className="hidden sm:flex items-center gap-3 mr-1">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                    <Zap size={14} />
                    <span className="font-semibold">{user.xp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm">
                    <Flame size={14} />
                    <span className="font-semibold">{user.streak}</span>
                  </div>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-gray-800/50 transition-all"
                aria-label="Toggle theme"
              >
                <div className="theme-icon-enter" key={isDark ? 'dark' : 'light'}>
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </div>
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/50 transition-all"
                >
                  <Globe size={16} />
                  <span className="text-xs font-medium uppercase">{lang === 'pt-br' ? 'PT' : lang.toUpperCase()}</span>
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl py-1 overflow-hidden z-20">
                      {langs.map(l => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${lang === l.code ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-gray-300'
                            }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Auth Button */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold text-sm overflow-hidden"
                  >
                    {user?.image ? (
                      <Image src={user.image} alt={user.displayName || "User avatar"} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      user?.avatar
                    )}
                  </Link>
                  {user?.walletAddress && (
                    <span className="hidden lg:inline text-xs font-mono text-slate-400 dark:text-gray-500">
                      {user.walletAddress.slice(0, 4)}..{user.walletAddress.slice(-4)}
                    </span>
                  )}
                  <button
                    onClick={() => logout()}
                    className="hidden sm:block text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 text-sm font-semibold hover:from-green-400 hover:to-yellow-300 transition-all shadow-lg shadow-green-500/20"
                >
                  {t('nav.login')}
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="md:hidden text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-gray-800'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
