'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SignInMenu } from '@/components/auth/sign-in-menu';
import { WalletConnectButton } from '@/components/layout/wallet-connect-button';
import { GraduationCap } from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: 'courses' | 'leaderboard' | 'community';
}

const navItems: NavItem[] = [
  { href: '/courses', labelKey: 'courses' },
  { href: '/leaderboard', labelKey: 'leaderboard' },
  { href: '/community', labelKey: 'community' },
];

export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Superteam Academy home"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="hidden font-bold text-lg sm:inline-block">
            Superteam Academy
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <SignInMenu />
          <WalletConnectButton />
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  );
}
