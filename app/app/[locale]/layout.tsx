/**
 * Locale layout — lightweight wrapper for i18n only.
 *
 * Heavy providers (Wallet, Auth, Query) live in (routes)/layout.tsx
 * so the public landing page stays lean.
 */

import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/context/i18n/routing';

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = (await import(`@/context/i18n/messages/${locale}.json`)).default;

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
