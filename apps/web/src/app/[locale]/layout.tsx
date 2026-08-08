import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { PhantomConnectProvider } from "@/components/auth/phantom-connect-provider";
import { PhantomAuthHandler } from "@/components/auth/phantom-auth-handler";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { GamificationOverlays } from "@/components/gamification/gamification-overlays";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout(props: LocaleLayoutProps) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  // CSP nonce set by middleware (lib/csp.ts). next-themes stamps it onto its
  // inline theme-flash-prevention <script> so it satisfies the nonce policy.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <NextIntlClientProvider messages={messages}>
        <SolanaWalletProvider>
          <PhantomConnectProvider>
            {/* Turns a connected embedded wallet into a Supabase session (#986),
                mirroring WalletAuthHandler for wallet-adapter wallets. */}
            <PhantomAuthHandler />
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
          </PhantomConnectProvider>
        </SolanaWalletProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
