'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConnectButton from '@/components/wallet/ConnectButton';
import { useI18n } from '@/i18n';
import { useXpBalance } from '@/hooks/useProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatXp, calculateLevel } from '@/lib/program';
import type { Locale } from '@/types';

const localeLabels: Record<Locale, string> = { en: '🇺🇸', pt: '🇧🇷', es: '🇪🇸' };
const locales: Locale[] = ['en', 'pt', 'es'];

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const { connected } = useWallet();
  const { balance } = useXpBalance();

  const navLinks = [
    { href: '/', label: t('nav.courses') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
    { href: '/profile', label: t('nav.profile') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-lg font-bold">S</span>
            </div>
            <span className="hidden font-bold sm:block">Superteam Academy</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-surface-800 text-surface-50'
                    : 'text-surface-200 hover:bg-surface-800/50 hover:text-surface-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {connected && balance > 0 && (
            <div className="hidden items-center gap-2 rounded-lg border border-surface-800 bg-surface-900 px-3 py-1.5 sm:flex">
              <span className="text-xs text-surface-200">XP</span>
              <span className="text-sm font-bold text-brand-400">{formatXp(balance)}</span>
              <span className="rounded bg-accent-600/20 px-1.5 py-0.5 text-xs font-medium text-accent-400">
                Lv.{calculateLevel(balance)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-surface-800 bg-surface-900 p-0.5">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-md px-2 py-1 text-sm transition-colors ${
                  locale === l ? 'bg-surface-800' : 'hover:bg-surface-800/50'
                }`}
              >
                {localeLabels[l]}
              </button>
            ))}
          </div>

          <ConnectButton />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-surface-800 px-4 py-2 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
              pathname === link.href
                ? 'bg-surface-800 text-surface-50'
                : 'text-surface-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
