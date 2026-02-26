import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderWrapper } from "@/context/WalletProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { XPProvider } from "@/context/XPContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Superteam Academy — Learn Solana Development",
  description: "The most advanced on-chain learning platform for Solana developers.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%239945ff'/><text y='.9em' font-size='80' x='10'>⚡</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <WalletProviderWrapper>
            <XPProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 pt-14">{children}</main>
                <Footer />
              </div>
            </XPProvider>
          </WalletProviderWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}