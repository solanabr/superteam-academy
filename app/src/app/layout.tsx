import type { Metadata } from "next";
import { Outfit, Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProvider } from "@/providers/session-provider";
import { WalletProvider } from "@/providers/wallet-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SolanaProgramProvider } from "@/providers/solana-program-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy | Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The open-source learning platform for Solana developers. Earn XP, collect on-chain credentials, and master blockchain development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${firaCode.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <WalletProvider>
              <SolanaProgramProvider>
                <AuthProvider>
                  <LocaleProvider>
                    <AnalyticsProvider>
                      <div className="flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">{children}</main>
                        <Footer />
                      </div>
                    </AnalyticsProvider>
                  </LocaleProvider>
                </AuthProvider>
              </SolanaProgramProvider>
            </WalletProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
