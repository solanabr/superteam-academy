'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';
import { LocaleSwitcher } from '@/components/locale/LocaleSwitcher';

interface HeaderProps {
  activePage?: 'courses' | 'leaderboard' | 'dashboard' | 'about';
}

export function Header({ activePage }: HeaderProps) {
  const t = useTranslations('navigation');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="h-6 w-6 text-primary" />
          <span>Superteam Academy</span>
        </Link>
        <nav className="flex items-center gap-6 ml-8 text-sm">
          <Link
            href="/courses"
            className={activePage === 'courses' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground transition-colors'}
          >
            {t('courses')}
          </Link>
          <Link
            href="/leaderboard"
            className={activePage === 'leaderboard' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground transition-colors'}
          >
            {t('leaderboard')}
          </Link>
          <Link
            href="/dashboard"
            className={activePage === 'dashboard' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground transition-colors'}
          >
            {t('dashboard')}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <Button>{t('connectWallet')}</Button>
        </div>
      </div>
    </header>
  );
}
