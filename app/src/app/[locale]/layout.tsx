import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  const htmlLang = locale === "pt-br" ? "pt-BR" : locale;

  return (
    <NextIntlClientProvider messages={messages}>
      <AppProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang="${htmlLang}";`,
          }}
        />
        <div className="relative min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <Navbar locale={locale} />
          <main id="main-content" className="relative z-[1]">
            {children}
          </main>
          <InstallPrompt />
          <OfflineIndicator />
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
