'use client';

import { useTranslations } from 'next-intl';

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('analytics')}</h1>
      <p className="mt-2 text-muted-foreground">Platform-wide analytics and metrics.</p>
    </div>
  );
}
