import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { SolanaWalletProvider } from "@/components/providers/wallet-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AuthProvider } from "@/components/providers/auth-context";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { HackerTransition } from "@/components/ui/hacker-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Superteam Academy | Master Solana Development",
  description:
    "The ultimate interactive learning platform for Solana developers. Build real projects, earn on-chain credentials, and get paid to code.",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
            <AuthProvider>
              <SolanaWalletProvider>
                <HackerTransition>{children}</HackerTransition>
              </SolanaWalletProvider>
            </AuthProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
