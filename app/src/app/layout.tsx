// app/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Superteam Academy LMS",
  description: "Learn Solana Development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Темная тема по умолчанию!
            enableSystem
            disableTransitionOnChange
          >
            <ProvidersWrapper>
              {children}
            </ProvidersWrapper>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}