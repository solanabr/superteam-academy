import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { ReferralCapture } from "@/components/referrals/referral-capture";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastContainer } from "@/components/ui/toast-container";

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

  // The wallet/Dynamic provider stack and the gamification overlays are NOT
  // here (#1097): they mount in (platform)/layout.tsx, so marketing and admin
  // first loads don't pay for wallet-adapter, the Dynamic SDK, or TanStack
  // Query. The Header sits ABOVE that stack, so its wallet consumers cannot
  // reach it through context and read the module-level ambient store instead
  // (lib/solana/ambient-wallet-store.ts); the sign-in modal lazily mounts its
  // own scoped stack when opened outside (platform).
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <NextIntlClientProvider messages={messages}>
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
              {/* Global on purpose: marketing pages dispatch toasts too
                  (AuthErrorToast on refused logins), so the container cannot
                  ride along with the (platform)-only overlays. */}
              <ToastContainer />
            </div>
          </AnalyticsProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
