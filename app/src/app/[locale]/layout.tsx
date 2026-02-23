import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { WalletLinkBanner } from "@/components/layout/wallet-link-banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";

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

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <SolanaWalletProvider>
          <ThemeProvider>
            <Suspense>
              <AnalyticsProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <WalletLinkBanner />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </AnalyticsProvider>
            </Suspense>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </SolanaWalletProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
