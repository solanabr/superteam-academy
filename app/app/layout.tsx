import { Toaster } from "@/components/ui/sonner";
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
