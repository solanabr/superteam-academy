import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { ReferralCapture } from "@/components/referrals/referral-capture";
import { DynamicWalletProvider } from "@/components/auth/dynamic-wallet-provider";
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
          {/* DynamicAuthHandler is mounted by the provider itself, not here:
              its hook throws outside a DynamicContextProvider, so it must never
              be a sibling. */}
          <DynamicWalletProvider>
            <AuthProvider>
              {/* Captures ?ref= codes on any page and claims them once a
                  session exists — attribution without touching any of the
                  four auth flows. No UI. */}
              <ReferralCapture />
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
          </DynamicWalletProvider>
        </SolanaWalletProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
