import { QueryProvider } from "@/providers/QueryProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { NavbarWrapper } from "@/components/landing/NavbarWrapper";
import { siteConfig } from "@/config/siteConfig";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
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

