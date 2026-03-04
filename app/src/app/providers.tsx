"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"
import { LocaleProvider } from "@/components/providers/LocaleProvider"
import { AppLocale, DEFAULT_LOCALE } from "@/lib/locale"

// WalletProviders is NOT included here — it is added only in layouts that need it:
//   (auth)/layout.tsx     → sign-in / sign-up pages (wallet sign-in option)
//   (consumer)/layout.tsx → authenticated users (sidebar wallet button, enroll, etc.)
// This keeps the ~340 KiB Solana wallet adapter bundle off the public landing page.

export function Providers({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode
  initialLocale?: AppLocale
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <LocaleProvider initialLocale={initialLocale}>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
