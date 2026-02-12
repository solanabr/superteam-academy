'use client';

import { useTranslations } from 'next-intl';

export default function TeachAnalyticsPage() {
  const t = useTranslations('teach');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('analytics')}</h1>
      <p className="mt-2 text-muted-foreground">Course analytics and student metrics.</p>
    </div>
  );
}
