import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderWrapper } from "@/context/WalletProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { XPProvider } from "@/context/XPContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GamificationProvider } from "@/context/GamificationProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleAnalytics } from '@next/third-parties/google';
import "@solana/wallet-adapter-react-ui/styles.css";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Superteam Academy – Learn Solana Development",
  description: "The most advanced on-chain learning platform for Solana developers.",
  manifest: "/manifest.json",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%239945ff'/><text y='.9em' font-size='80' x='10'>⚡</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%239945ff'/><text y='.9em' font-size='80' x='10'>⚡</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleAnalytics gaId="G-FHKG5DZED4" />
        <Script id="clarity" strategy="afterInteractive">
  {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","vq2qbe985x");`}
</Script>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <WalletProviderWrapper>
                <XPProvider>
                  <PostHogProvider>
                    <GamificationProvider>
                      <div className="flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-1 pt-14">{children}</main>
                        <Footer />
                      </div>
                    </GamificationProvider>
                  </PostHogProvider>
                </XPProvider>
              </WalletProviderWrapper>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}