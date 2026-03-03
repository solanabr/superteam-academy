import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/context/i18n/routing';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { WalletProvider } from '@/app/providers/WalletProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { NotificationProvider } from '@/context/stores/notificationStore';
import { ToastProvider } from '@/app/providers/ToastProvider';

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
            <QueryProvider>
                <WalletProvider>
                    <AuthProvider>
                        <NotificationProvider>
                            {children}
                            <ToastProvider />
                        </NotificationProvider>
                    </AuthProvider>
                </WalletProvider>
            </QueryProvider>
        </NextIntlClientProvider>
    );
}
