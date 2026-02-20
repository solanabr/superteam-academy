import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
// Header and Footer removed for custom page layouts
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncUserOnLogin } from "@/components/auth/SyncUserOnLogin";
import { ThirdPartyScripts } from "@/components/analytics/ThirdPartyScripts";
import "../globals.css"; // Adjusted path
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Master Solana at the metal level",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col font-body antialiased bg-void text-text-primary selection:bg-solana/20 selection:text-solana`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <SyncUserOnLogin />
            <ThirdPartyScripts />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
