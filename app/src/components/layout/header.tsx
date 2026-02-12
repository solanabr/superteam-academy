'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';
import { WalletButton } from './wallet-button';
import { BookOpen, LayoutDashboard, Menu, Trophy } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const t = useTranslations('common');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/courses', label: t('exploreCourses'), icon: BookOpen },
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SA
          </span> 
          <span className="hidden font-semibold tracking-tight sm:inline">
            Superteam Academy
          </span> 
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button variant="ghost" size="sm" className="gap-2 font-medium">
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 overflow-visible">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <WalletButton />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
