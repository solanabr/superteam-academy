import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Header, Footer } from '@/components/layout'
import { ThemeProvider, WalletProvider, AuthProvider, QueryProvider } from '@/components/providers'
import { I18nProvider } from '@/lib/hooks/useI18n'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Superteam Academy - Learn Solana Development',
  description: 'Interactive learning platform for Solana developers with interactive courses, gamification, and on-chain credentials.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <body className={`${inter.variable} ${jetbrains.variable} ${spaceGrotesk.variable} font-sans bg-terminal-bg text-foreground transition-colors duration-200`}>
        <QueryProvider>
          <AnalyticsProvider>
            <AuthProvider>
              <WalletProvider>
                <ThemeProvider>
                  <I18nProvider>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                  </I18nProvider>
                </ThemeProvider>
              </WalletProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
