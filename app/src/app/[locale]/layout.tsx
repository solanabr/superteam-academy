import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { inter, jetbrainsMono } from "@/lib/fonts";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@/lib/analytics/ga4";
import { ClarityAnalytics } from "@/lib/analytics/clarity";
import { PostHogProvider } from "@/lib/analytics/posthog";
import { LazyWalletProvider } from "@/components/wallet/LazyWalletProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { GlobalKeyboardShortcuts } from "@/components/ui/KeyboardShortcutsDialog";
import { GlobalCommandPalette } from "@/components/search/CommandPalette";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: { default: t("appName"), template: `%s | ${t("appName")}` },
    description: t("appDescription"),
    manifest: "/manifest.json",
    other: {
      "theme-color": "#7c3aed",
    },
    openGraph: {
      title: t("appName"),
      description: t("appDescription"),
      type: "website",
      siteName: t("appName"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("appName"),
      description: t("appDescription"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "pt-BR" | "en" | "es")) {
    notFound();
  }

  setRequestLocale(locale);

  const tc = await getTranslations("common");

  let messages;
  try {
    messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://devnet.helius-rpc.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://arweave.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://app.posthog.com" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-foreground bg-background relative min-h-screen`}
      >
        {/* Global Ambient Background */}
        <div className="fixed inset-0 z-[-2] bg-mesh opacity-20 pointer-events-none" />
        <div className="fixed inset-0 z-[-1] bg-dots opacity-[0.15] mix-blend-overlay pointer-events-none" />
        <NavigationProgress />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">{tc("skipToContent")}</a>
        <ServiceWorkerRegistration />
        <GoogleAnalytics />
        <ClarityAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <LazyWalletProvider>
              <PostHogProvider>
                <NextIntlClientProvider locale={locale} messages={messages}>
                  <OnboardingModal />
                  <GlobalKeyboardShortcuts />
                  <GlobalCommandPalette />
                  <div className="flex min-h-screen">
                    {/* Desktop sidebar */}
                    <Sidebar />
                    {/* Main content area */}
                    <div className="flex min-h-screen flex-1 flex-col sidebar-content-shift">
                      <Header />
                      <main id="main-content" className="flex-1 animate-fade-in-page pb-16 md:pb-0">
                        {children}
                      </main>
                      <Footer />
                    </div>
                    {/* Mobile bottom nav */}
                    <BottomNav />
                  </div>
                  <Toaster richColors position="bottom-right" />
                </NextIntlClientProvider>
              </PostHogProvider>
            </LazyWalletProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
