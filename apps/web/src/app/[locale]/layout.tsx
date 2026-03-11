import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { GamificationOverlays } from "@/components/gamification/gamification-overlays";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider messages={messages}>
        <SolanaWalletProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <div className="grid-bg flex min-h-screen flex-col bg-[var(--bg)]">
                <Header />
                <main id="main-content" className="flex-1 pt-[60px]">
                  {children}
                </main>
                <MobileBottomNav />
                <GamificationOverlays />
              </div>
            </AnalyticsProvider>
          </AuthProvider>
        </SolanaWalletProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
