import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Superteam Academy — Learn Web3 on Solana',
  description: 'Decentralized Learning Management System for Superteam Brazil. Learn Solana development, earn on-chain certificates.',
  keywords: ['Solana', 'Web3', 'blockchain', 'education', 'LMS', 'Superteam', 'Brazil'],
  openGraph: {
    title: 'Superteam Academy',
    description: 'Learn Solana. Earn On-Chain Credentials.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
