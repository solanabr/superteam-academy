import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['700', '900'],
  display: 'swap',
  preload: true,
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://academy.superteam.fun'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Superteam Academy | Learn Solana & Web3',
  description:
    'Decentralized learning on Solana. Enroll in courses, earn soulbound XP, collect credentials, and join the builder community.',
  openGraph: {
    title: 'Superteam Academy | Learn Solana & Web3',
    description:
      'Decentralized learning on Solana. Enroll in courses, earn soulbound XP, collect credentials, and join the builder community.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Superteam Academy | Learn Solana & Web3',
    description:
      'Decentralized learning on Solana. Enroll in courses, earn soulbound XP, collect credentials, and join the builder community.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1f12',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  )
}
