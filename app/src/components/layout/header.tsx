'use client';

import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SignInMenu } from '@/components/auth/sign-in-menu';
import { GraduationCap, Wallet } from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: 'courses' | 'leaderboard' | 'community';
}

const navItems: NavItem[] = [
  { href: '/courses', labelKey: 'courses' },
  { href: '/leaderboard', labelKey: 'leaderboard' },
  { href: '/community', labelKey: 'community' },
];

function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { publicKey, connected } = useWallet();

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
          <Button
            variant={connected ? 'outline' : 'default'}
            size="sm"
            className="gap-2"
            aria-label={
              connected
                ? `Wallet connected: ${publicKey?.toBase58()}`
                : tCommon('connect_wallet')
            }
          >
            <Wallet className="h-4 w-4" />
            {connected && publicKey
              ? truncateAddress(publicKey.toBase58())
              : tCommon('connect_wallet')}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  );
}
