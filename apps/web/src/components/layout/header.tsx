'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from './notification-bell';
import { GlobalSearch } from './global-search';
import type { UserRole } from '@/types';

export function Header() {
  const t = useTranslations('nav');
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const role = session?.user?.role as UserRole | undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-xl font-bold text-transparent">
            Superteam Academy
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          <Link href="/courses" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('courses')}
          </Link>
          <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('leaderboard')}
          </Link>
          <Link href="/community" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('community')}
          </Link>
          <Link href="/challenges" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('challenges')}
          </Link>
          {session && (
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t('dashboard')}
            </Link>
          )}
          {(role === 'professor' || role === 'admin') && (
            <Link href="/teach/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t('teach')}
            </Link>
          )}
          {role === 'admin' && (
            <Link href="/admin/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t('admin')}
            </Link>
          )}
        </nav>

        {/* Right side: Search, Notifications, Language, Theme, Auth */}
        <div className="flex items-center space-x-3">
          <GlobalSearch />
          <LanguageSwitcher />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {session && <NotificationBell />}

          {session ? (
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                {session.user?.name ?? t('profile')}
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signin">
              <Button variant="solana" size="sm">
                {t('connectWallet')}
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
