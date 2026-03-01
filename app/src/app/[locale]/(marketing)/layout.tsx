import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Learn Solana development through interactive courses. Earn soulbound XP tokens and verifiable NFT credentials.',
  openGraph: {
    title: 'Superteam Academy',
    description: 'Interactive Solana developer education with on-chain credentials.',
    type: 'website',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
