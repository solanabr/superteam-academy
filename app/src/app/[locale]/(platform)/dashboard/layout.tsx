import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Track your Solana learning progress, view earned XP, manage credentials, and continue your courses.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
