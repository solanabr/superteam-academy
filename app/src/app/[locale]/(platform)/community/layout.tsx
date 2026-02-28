import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Connect with fellow Solana developers. Discuss courses, share projects, and collaborate in the Superteam Academy forum.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
