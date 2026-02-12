import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your learning progress, XP, streaks, and enrolled courses.',
  openGraph: {
    title: 'Dashboard | Superteam Academy',
    description: 'Your personal learning dashboard — XP, streaks, and course progress.',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
