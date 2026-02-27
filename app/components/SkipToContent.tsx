'use client';

import { useI18n } from '@/lib/i18n/context';

export function SkipToContent() {
  const { t } = useI18n();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-body focus:font-semibold focus:text-[rgb(3_7_18)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg-page))]"
    >
      {t('skipToContent')}
    </a>
  );
}
