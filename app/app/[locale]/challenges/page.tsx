'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Zap, Code2, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';

const DIFF_COLORS: Record<string, string> = {
  Beginner:     'bg-green-900/50 text-green-300 border border-green-700/50',
  Intermediate: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  Advanced:     'bg-red-900/50 text-red-300 border border-red-700/50',
};

const CHALLENGES = [
  {
    id: 'transfer-sol',
    title: 'Transfer SOL Between Wallets',
    description: 'Implement a function that transfers SOL between wallets on the Solana network.',
    difficulty: 'Beginner',
    xp: 200,
    track: 'Solana Core',
  },
  {
    id: 'create-token',
    title: 'Create an SPL Token',
    description: 'Implement a function that creates a new SPL token on Solana with configurable decimals.',
    difficulty: 'Intermediate',
    xp: 350,
    track: 'Token Program',
  },
  {
    id: 'anchor-counter',
    title: 'Build an Anchor Counter',
    description: 'Write a simple Anchor program that increments and decrements a counter on-chain.',
    difficulty: 'Intermediate',
    xp: 500,
    track: 'Anchor',
    comingSoon: true,
  },
  {
    id: 'nft-mint',
    title: 'Mint a Compressed NFT',
    description: 'Use Metaplex Bubblegum to mint a compressed NFT for cost-efficient on-chain art.',
    difficulty: 'Advanced',
    xp: 750,
    track: 'NFTs / Metaplex',
    comingSoon: true,
  },
];

export default function ChallengesPage() {
  const t = useTranslations('landing');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-3">
          <Code2 className="h-4 w-4" />
          <span>Superteam Academy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">{t('code_challenges')}</h1>
        <p className="text-gray-400 max-w-xl">{t('code_challenges_desc')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Challenges', value: '4' },
          { label: 'Total XP', value: '1,800' },
          { label: 'Tracks', value: '3' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="text-2xl font-extrabold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHALLENGES.map((challenge) => (
          <div
            key={challenge.id}
            className={cn(
              'group rounded-2xl border bg-gray-900/60 p-5 flex flex-col transition-all duration-200',
              challenge.comingSoon
                ? 'border-gray-800 opacity-60 cursor-default'
                : 'border-gray-800 hover:border-purple-700/60 hover:bg-gray-900/80 cursor-pointer'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{challenge.track}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFF_COLORS[challenge.difficulty])}>
                {challenge.difficulty}
              </span>
            </div>

            <h2 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {challenge.title}
            </h2>
            <p className="text-sm text-gray-400 flex-1 mb-4 leading-relaxed">{challenge.description}</p>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-yellow-300 font-medium">
                <Zap className="h-3.5 w-3.5" />
                +{challenge.xp} XP
              </span>

              {challenge.comingSoon ? (
                <span className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-500">Coming Soon</span>
              ) : (
                <Link
                  href={localePath(`/challenges/${challenge.id}`, locale)}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all"
                >
                  Start
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon banner */}
      <div className="mt-8 rounded-2xl border border-purple-800/30 bg-purple-900/10 p-5 flex items-center gap-4">
        <Trophy className="h-8 w-8 text-purple-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white mb-1">More challenges coming soon</div>
          <div className="text-xs text-gray-400">
            New weekly challenges covering DeFi, NFTs, Anchor programs, and more. Complete them to earn XP and climb the leaderboard.
          </div>
        </div>
      </div>
    </div>
  );
}
