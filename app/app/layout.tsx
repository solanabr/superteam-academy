import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Providers } from "@/components/providers";
import { ConnectButton } from "@/components/connect-wallet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Decentralized learning platform on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <TooltipProvider>
            <header className="border-b border-border px-4 py-3">
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <Link href="/" aria-label="Go to home">
                  <Image
                    src="/logo-green.svg"
                    alt="Superteam Academy"
                    width={176}
                    height={30}
                    className="h-8 w-auto dark:hidden"
                    priority
                  />
                  <Image
                    src="/logo-white.svg"
                    alt="Superteam Academy"
                    width={176}
                    height={30}
                    className="hidden h-8 w-auto dark:block"
                    priority
                  />
                </Link>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <ConnectButton />
                </div>
              </div>
            </header>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
