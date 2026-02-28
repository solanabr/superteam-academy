import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Catalog',
  description:
    'Browse Solana development courses across tracks: Core, DeFi, NFT, and Security. Interactive lessons with on-chain XP rewards.',
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
