'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useI18n, LanguageSwitcher } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';

export function Navbar() {
  const { connected } = useWallet();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/courses', label: t('nav.courses') },
    { href: '/paths', label: 'Trilhas' },
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🎓</span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Superteam Academy
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {connected && (
            <>
              <Link href="/profile" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                👤
              </Link>
              <Link href="/admin" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                ⚙️
              </Link>
            </>
          )}
          <WalletMultiButton className="!bg-purple-600 !hover:bg-purple-500 !rounded-lg !h-9 !text-sm" />
        </div>
      </div>
    </nav>
  );
}
