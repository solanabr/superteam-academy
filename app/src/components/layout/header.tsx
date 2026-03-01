'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ConnectButton } from '@/components/wallet/connect-button';
import { LanguageSwitcher } from './language-switcher';
import { XpDisplay } from '@/components/gamification/xp-display';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  BookOpen,
  Trophy,
  User,
  Award,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Header() {
  const t = useTranslations('nav');
  const { connected } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/courses', label: t('courses'), icon: BookOpen },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { href: '/achievements', label: t('achievements'), icon: Award },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-solana-purple" />
            <span className="hidden sm:inline bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Superteam Academy
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4" role="navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {connected && <XpDisplay />}
          <LanguageSwitcher />
          <ConnectButton />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t bg-background p-4" role="navigation">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
