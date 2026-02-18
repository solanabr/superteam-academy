import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ConnectButton } from "@/components/connect-wallet";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Decentralized learning platform on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="border-b border-border px-4 py-3">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <span className="font-semibold">Superteam Academy</span>
              <ConnectButton />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
