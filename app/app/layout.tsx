import { QueryProvider } from "@/providers/QueryProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics/Analytics";
import { NavbarWrapper } from "@/components/landing/NavbarWrapper";
import { siteConfig } from "@/config/siteConfig";
import { Geist, Geist_Mono, Jersey_10, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gameFont = Jersey_10({
  subsets: ["latin"],
  variable: "--font-game",
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = siteConfig;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Superteam Brasil",
  url: "https://brasil.superteam.life",
  description:
    "Comunidade Solana no Brasil. Aprenda, construa e cresça no ecossistema Solana.",
  inLanguage: "pt-BR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${gameFont.variable} ${inter.variable} antialiased bg-zinc-900`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `globalThis.litIssuedWarnings=globalThis.litIssuedWarnings||new Set();globalThis.litIssuedWarnings.add("Lit is in dev mode. Not recommended for production! See https://lit.dev/msg/dev-mode for more information.");`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <SolanaProvider>
            <QueryProvider>
              <Analytics />
              <NavbarWrapper />
              {children}
            </QueryProvider>
          </SolanaProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
