import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "SuperTeam - Interactive Blockchain Education",
  description:
    "Master Solana, Rust, and Web3 development through interactive coding challenges, gamified learning paths, and on-chain credentials.",
};

export const viewport: Viewport = {
  themeColor: "#0a9c3b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>
          {children}
          <Toaster position="bottom-right" />
        </AppProviders>
      </body>
    </html>
  );
}
