import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Superteam Academy - Learn Solana Development',
  description: 'Master Solana blockchain development with interactive courses, coding challenges, and hands-on projects. Built by the Superteam community.',
  keywords: [
    'Solana',
    'blockchain',
    'development',
    'learning',
    'courses',
    'Rust',
    'Web3',
    'DeFi',
    'NFT',
    'programming'
  ],
  authors: [{ name: 'Superteam' }],
  creator: 'Superteam',
  publisher: 'Superteam Academy',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://academy.superteam.fun',
    siteName: 'Superteam Academy',
    title: 'Superteam Academy - Learn Solana Development',
    description: 'Master Solana blockchain development with interactive courses, coding challenges, and hands-on projects.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Superteam Academy - Learn Solana Development'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Superteam Academy - Learn Solana Development',
    description: 'Master Solana blockchain development with interactive courses, coding challenges, and hands-on projects.',
    images: ['/og-image.jpg'],
    creator: '@SuperteamBR'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}