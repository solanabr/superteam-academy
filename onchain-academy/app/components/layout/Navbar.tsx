'use client';

/**
 * components/layout/Navbar.tsx
 *
 * Updated to use useAuth() instead of raw useWallet().
 * Auth state now drives nav link visibility and the action button.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from './LanguageSwitcher';
// @ts-ignore
import { AuthButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { formatXP } from '@/lib/utils';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { authStage, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated =
    authStage === 'google_only' ||
    authStage === 'fully_linked' ||
    authStage === 'wallet_only';

  const navLinks = [
    { href: '/courses',     label: 'Courses' },
    { href: '/leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ];

  const isActive = (href: string) => pathname.includes(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">ST</span>
          </div>
          <span className="hidden font-bold text-lg sm:inline">Superteam Academy</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: XP badge + auth + language */}
        <div className="hidden md:flex items-center gap-3">
          {/* XP Badge — only when profile exists */}
          {profile && (
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span>{formatXP(profile.total_xp)} XP</span>
            </Badge>
          )}

          <LanguageSwitcher />

          {/* Smart auth button — changes label based on auth stage */}
          {authStage === 'fully_linked' ? (
            <div className="flex items-center gap-1">
              <AuthButton variant="default" size="sm" />
              <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <AuthButton variant="default" size="sm" />
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t flex items-center gap-2">
              <LanguageSwitcher />
              <AuthButton variant="outline" size="sm" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
