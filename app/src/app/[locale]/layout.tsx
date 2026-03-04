import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogPageView } from "@/components/providers/posthog-provider";
import { GA4Provider, GA4PageView } from "@/components/providers/ga4-provider";
import { SentryProvider } from "@/components/providers/sentry-provider";
import { SessionHydrator } from "@/components/providers/session-hydrator";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { WalletSync } from "@/components/providers/wallet-sync";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { LocaleLang } from "@/components/layout/locale-lang";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("siteName"),
    description: t("siteDescription"),
  };
}

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props): Promise<ReactNode> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <>
      <LocaleLang locale={locale} />
      <NextIntlClientProvider messages={messages}>
        <QueryProvider>
          <SentryProvider>
            <GA4Provider>
              <PostHogProvider>
                <ThemeProvider>
                  <WalletProvider>
                    <WalletSync />
                    <PostHogPageView />
                    <GA4PageView />
                    <SessionHydrator />
                    <ServiceWorkerRegister />
                    {children}
                  </WalletProvider>
                </ThemeProvider>
              </PostHogProvider>
            </GA4Provider>
          </SentryProvider>
        </QueryProvider>
      </NextIntlClientProvider>
    </>
  );
}
