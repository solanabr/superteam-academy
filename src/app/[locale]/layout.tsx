import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { DevnetWarning, FaucetBanner } from "@/components/DevnetWarning";

import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "CommonUi" });

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <DevnetWarning />
        <FaucetBanner />
        <Nav />
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
      </Providers>
    </NextIntlClientProvider>
  );
}
