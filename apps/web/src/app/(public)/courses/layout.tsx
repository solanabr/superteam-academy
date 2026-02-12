import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Browse interactive Solana development courses — from beginner to advanced. Learn Rust, Anchor, DeFi, and more.',
  openGraph: {
    title: 'Course Catalog | Superteam Academy',
    description: 'Interactive courses for Solana developers with code challenges and on-chain credentials.',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
