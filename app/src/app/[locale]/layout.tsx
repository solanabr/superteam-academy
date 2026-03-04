import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { WalletLinkBanner } from "@/components/layout/wallet-link-banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OnboardingGuard } from "@/components/providers/onboarding-guard";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { OfflineBanner } from "@/components/offline-banner";

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
            <Suspense
              fallback={
                <div className="flex min-h-screen flex-col">
                  <div className="sticky top-0 z-50 h-[4.5rem] border-b border-border/40 bg-background/80" />
                  <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 w-48 rounded bg-accent" />
                      <div className="h-4 w-96 rounded bg-accent" />
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="h-48 rounded-xl bg-accent" />
                        <div className="h-48 rounded-xl bg-accent" />
                        <div className="h-48 rounded-xl bg-accent" />
                      </div>
                    </div>
                  </main>
                </div>
              }
            >
              <AnalyticsProvider>
                <div className="flex min-h-screen flex-col">
                  <OfflineBanner />
                  <Header />
                  <OnboardingGuard />
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
