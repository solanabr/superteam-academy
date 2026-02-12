import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'See who tops the Superteam Academy rankings. Compete for XP, streaks, and achievements.',
  openGraph: {
    title: 'Leaderboard | Superteam Academy',
    description: 'Global rankings for Solana learners — XP, streaks, and achievements.',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
