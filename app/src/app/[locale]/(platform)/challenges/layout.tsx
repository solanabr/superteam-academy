import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Challenges',
  description:
    'Complete daily Solana coding challenges to earn bonus XP. Sharpen your skills with timed, practical exercises.',
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
