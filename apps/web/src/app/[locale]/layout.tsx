import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
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
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider messages={messages}>
        <SolanaWalletProvider>
          <AnalyticsProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <main id="main-content" className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
              <GamificationOverlays />
            </div>
          </AnalyticsProvider>
        </SolanaWalletProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
