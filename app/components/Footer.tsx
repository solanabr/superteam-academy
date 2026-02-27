'use client';

import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';

export const SUPERTEAM_BR_X = 'https://x.com/superteambr';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t-2 border-t-accent/50 bg-surface/50" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-caption font-medium text-[rgb(var(--text))]">
              Superteam Brazil LMS
            </p>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">
              Learning Management System for Superteam Brazil Academy.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:flex-nowrap sm:gap-6" aria-label="Footer navigation">
            <Link href="/" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">{t('nav.home')}</Link>
            <Link href="/courses" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">{t('nav.courses')}</Link>
            <Link href="/dashboard" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">{t('nav.dashboard')}</Link>
            <Link href="/leaderboard" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">{t('nav.leaderboard')}</Link>
            <Link href="/profile" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">Profile</Link>
            <Link href="/settings" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">Settings</Link>
            <a href="https://superteam.fun/earn/listing/superteam-academy/" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">
              {t('footerBounty')}
            </a>
            <a href={SUPERTEAM_BR_X} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">
              {t('footerSuperteam')}
            </a>
            <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-caption font-medium text-accent hover:underline">
              {t('footerGitHub')}
            </a>
          </nav>
        </div>
        <div className="mt-8 rounded-lg border border-border/50 bg-surface/50 p-4">
          <p className="text-caption font-medium text-[rgb(var(--text))]">{t('footerStayUpdated')}</p>
          <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">{t('footerNewsletterDesc')}</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()} aria-label="Newsletter signup">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-border/50 bg-[rgb(var(--bg))] px-3 py-2 text-caption text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-subtle))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Email address"
            />
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-caption font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none">
              {t('subscribe')}
            </button>
          </form>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-caption text-[rgb(var(--text-subtle))]">
            {t('footerCredits')} · {t('footerMadeFor')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
