import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description:
    'See the top Solana learners ranked by soulbound XP. Compare your progress and climb the ranks.',
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
