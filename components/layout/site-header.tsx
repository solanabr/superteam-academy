'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/i18n-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { WalletStatus } from '@/components/wallet/wallet-status';
import { getRegistrationRecord, REGISTRATION_CHANGED_EVENT } from '@/lib/auth/registration-storage';
import { cn } from '@/lib/utils';

const publicNavItems = [
  { href: '/' as Route, key: 'home' as const },
  { href: '/courses' as Route, key: 'courses' as const },
  { href: '/leaderboard' as Route, key: 'leaderboard' as const }
];

const onboardingNavItems = [
  { href: '/login' as Route, key: 'login' as const },
  { href: '/register' as Route, key: 'register' as const }
];

const accountNavItems = [
  { href: '/dashboard' as Route, key: 'dashboard' as const },
  { href: '/profile' as Route, key: 'profile' as const },
  { href: '/settings' as Route, key: 'settings' as const }
];

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();
  const { dictionary } = useI18n();
  const { authenticated, loading, logout } = useAuth();
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [navOpen, setNavOpen] = useState<boolean>(false);

  useEffect(() => {
    function syncRegistration(): void {
      setHasAccount(Boolean(getRegistrationRecord()));
    }

    syncRegistration();
    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);

    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const navItems = [...publicNavItems, ...(hasAccount ? accountNavItems : onboardingNavItems)];

  async function handleLogout(): Promise<void> {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header data-testid="site-header" className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            data-testid="brand-home-link"
            className="rounded-2xl border border-border/70 bg-card/70 px-3 py-2 shadow-sm transition hover:bg-card/85"
          >
            <p className="text-sm font-extrabold tracking-wide text-primary">{dictionary.appName}</p>
            <p className="text-[11px] text-foreground/65">{dictionary.header.tagline}</p>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {authenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loading || signingOut}
                data-testid="header-signout-button"
                aria-label={dictionary.actions.signOut}
                title={dictionary.actions.signOut}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/75 text-foreground/85 shadow-sm transition hover:bg-muted/80 disabled:opacity-60"
              >
                {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                <span className="sr-only">{signingOut ? dictionary.common.loading : dictionary.actions.signOut}</span>
              </button>
            ) : null}
            <WalletStatus />
          </div>
        </div>

        <div
          id="header-navigation-panel"
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out',
            navOpen
              ? 'mt-2 grid-rows-[1fr] opacity-100'
              : 'pointer-events-none mt-0 grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="flex justify-center">
              <nav data-testid="site-nav" className="max-w-full overflow-x-auto">
                <div className="flex w-max items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const label = dictionary.nav[item.key];

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-testid={`nav-${item.key}`}
                        className={cn(
                          'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted/80',
                          active && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary'
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-2 border-t border-border/70">
          <div className={cn('flex justify-center transition-all duration-300', navOpen ? 'pt-2.5' : 'pt-1.5')}>
            <button
              type="button"
              onClick={() => setNavOpen((current) => !current)}
              aria-expanded={navOpen}
              aria-controls="header-navigation-panel"
              data-testid="header-nav-toggle"
              aria-label={navOpen ? dictionary.header.menuClose : dictionary.header.menuOpen}
              title={navOpen ? dictionary.header.menuClose : dictionary.header.menuOpen}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-all duration-300',
                navOpen
                  ? 'border-primary/40 bg-primary/20 text-primary hover:bg-primary/25'
                  : 'border-border/70 bg-card/90 text-foreground/85 hover:bg-muted/80'
              )}
            >
              {navOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
