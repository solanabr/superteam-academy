'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Home, Search } from 'lucide-react';
import { localePath } from '@/lib/paths';

export default function NotFound() {
  const t = useTranslations('common');
  const locale = useLocale();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-7xl font-bold text-purple-500/20">404</div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t('page_not_found')}</h2>
          <p className="mt-2 text-gray-400">
            {t('page_not_found_desc')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            <Home className="h-4 w-4" />
            {t('home')}
          </Link>
          <Link
            href={localePath(locale, '/courses')}
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
          >
            <Search className="h-4 w-4" />
            {t('browse_courses')}
          </Link>
        </div>
      </div>
    </div>
  );
}
