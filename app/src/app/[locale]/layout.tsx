import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy",
    template: "%s | Superteam Academy",
  },
  description:
    "Learn Solana development, earn XP tokens, and collect credential NFTs. The decentralized learning platform for the Solana ecosystem.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://academy.superteam.fun"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@superaborabrasil",
  },
};

const locales = ["en", "pt-BR", "es"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster
              theme="system"
              position="bottom-right"
              richColors
              closeButton
            />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
