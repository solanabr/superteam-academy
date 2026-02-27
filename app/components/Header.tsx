'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from './WalletProvider';
import { XPBadge } from './XPBadge';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useI18n } from '@/lib/i18n/context';

const nav = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/courses', labelKey: 'nav.courses' },
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/leaderboard', labelKey: 'nav.leaderboard' },
  { href: 'https://x.com/superteambr', labelKey: 'nav.community', external: true },
];

function LogoIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[rgb(var(--bg))]/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:px-6 sm:py-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-body font-semibold text-[rgb(var(--text))] no-underline transition hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))] focus-visible:outline-none rounded-md"
        >
          <LogoIcon />
          <span className="hidden sm:inline">Superteam Brazil LMS</span>
          <span className="sm:hidden">LMS</span>
        </Link>
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:flex-nowrap">
          {nav.map(({ href, labelKey, external }) => {
            const active = !external && (pathname === href || (href !== '/' && pathname.startsWith(href)));
            const className = `whitespace-nowrap rounded-md px-2 py-2 text-caption font-medium transition sm:px-3 ${
              active
                ? 'bg-accent/15 text-accent'
                : 'text-[rgb(var(--text-muted))] hover:bg-surface/80 hover:text-[rgb(var(--text))]'
            }`;
            if (external) {
              return (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {t(labelKey)}
                </a>
              );
            }
            return (
              <Link key={href} href={href} className={className}>
                {t(labelKey)}
              </Link>
            );
          })}
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="ml-2 flex items-center gap-2">
            <XPBadge />
            <WalletMultiButton className="!h-9 !rounded-md !px-4 !text-caption" />
          </div>
        </nav>
      </div>
    </header>
  );
}
