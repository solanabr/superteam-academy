import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Nunito, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "@/styles/globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Superteam Academy — Learn Solana Development",
    template: "%s | Superteam Academy",
  },
  description:
    "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
  keywords: [
    "Solana",
    "blockchain",
    "Web3",
    "developer education",
    "Rust",
    "Anchor",
    "DeFi",
    "NFT",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Superteam Academy",
    title: "Superteam Academy — Learn Solana Development",
    description:
      "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superteam Academy — Learn Solana Development",
    description:
      "The definitive learning platform for Solana developers. Interactive courses, on-chain credentials, and a community of builders.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "en";

  const skipText =
    locale === "pt-BR"
      ? "Pular para o conteúdo principal"
      : locale === "es"
        ? "Saltar al contenido principal"
        : "Skip to main content";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg focus:px-4 focus:py-2 focus:text-text focus:ring-2 focus:ring-ring"
        >
          {skipText}
        </a>
        {children}
      </body>
    </html>
  );
}
