import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Solana-native LMS for builders",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(47,107,63,0.24),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,210,63,0.2),transparent_35%),linear-gradient(180deg,var(--background)_0%,var(--background)_100%)]" />
            <Header />
            <div className="mx-auto flex w-full max-w-7xl flex-1">
              <Sidebar />
              <main className="w-full px-4 py-6 sm:px-6">{children}</main>
            </div>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
