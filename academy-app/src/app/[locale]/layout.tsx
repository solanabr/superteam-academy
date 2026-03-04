
import { Nunito } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale, NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { routing } from "~/i18n/routing";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

import Providers from "./provider";
import { Toaster } from "~/components/ui/sonner"
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
        <Toaster richColors position="top-right" />
        <GoogleAnalytics gaId="G-STACADEMY26" />
        <Script
          id="heatmap-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "placeholder_clarity_id");
            `,
          }}
        />
      </body>
    </html>
  );
}
