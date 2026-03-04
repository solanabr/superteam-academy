import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/components/providers/app-providers";
import { AppLayoutWrapper } from "@/components/layout/app-layout-wrapper";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders>
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
