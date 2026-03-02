
import { Nunito } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale, NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { routing } from "~/i18n/routing";

import Providers from "./provider";
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LayoutProps<'/[locale]'>, 'children'>
) {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: 'LocaleLayout'
  });

  return {
    title: t('title')
  };
}

export default async function LocaleLayout({
  children,
  params
}: LayoutProps<'/[locale]'>) {

  const { locale } = await params;
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body
        className={`${nunito.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           <Providers>
              {children}
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
