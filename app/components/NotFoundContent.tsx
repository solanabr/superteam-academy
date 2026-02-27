'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

export function NotFoundContent() {
  const { t } = useI18n();
  return (
    <main id="main-content" className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6" tabIndex={-1}>
      <p className="text-display font-bold text-accent" aria-hidden>404</p>
      <h1 className="text-title mt-2 font-semibold text-[rgb(var(--text))]">{t('notFoundTitle')}</h1>
      <p className="text-body mt-2 max-w-sm text-[rgb(var(--text-muted))]">{t('notFoundDescription')}</p>
      <Link
        href="/"
        className="text-body mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-[rgb(3_7_18)] transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
      >
        {t('backToHome')}
      </Link>
    </main>
  );
}
