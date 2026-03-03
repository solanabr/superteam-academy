import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — Superteam Academy',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex h-screen bg-cream overflow-hidden'>{children}</div>
  )
}
