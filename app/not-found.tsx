'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/i18n-provider';

export default function NotFound(): JSX.Element {
  const { dictionary } = useI18n();

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-border/80 bg-card/70 p-8 text-center">
      <h1 className="text-3xl font-extrabold">{dictionary.notFound.title}</h1>
      <p className="text-sm text-foreground/75">{dictionary.notFound.description}</p>
      <Link href="/" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        {dictionary.nav.home}
      </Link>
    </div>
  );
}
