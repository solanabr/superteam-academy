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

// Challenge rotation: daily challenges rotate based on day-of-year, weekly on ISO week
const DAY_OF_YEAR = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
const WEEK_OF_YEAR = Math.ceil(DAY_OF_YEAR / 7);

type ChallengeType = 'daily' | 'weekly' | 'seasonal' | 'permanent';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  xp: number;
  track: string;
  type: ChallengeType;
  comingSoon?: boolean;
  expiresLabel?: string;
}

const ALL_DAILY: Challenge[] = [
  { id: 'transfer-sol', title: 'Transfer SOL Between Wallets', description: 'Implement a function that transfers SOL between wallets on the Solana network.', difficulty: 'Beginner', xp: 200, track: 'Solana Core', type: 'daily' },
  { id: 'read-account', title: 'Read Account Data', description: 'Fetch and deserialize account data from a Solana program using web3.js.', difficulty: 'Beginner', xp: 200, track: 'Solana Core', type: 'daily' },
  { id: 'serialize-ix', title: 'Serialize an Instruction', description: 'Manually build and serialize a transaction instruction with Borsh encoding.', difficulty: 'Intermediate', xp: 300, track: 'Solana Core', type: 'daily' },
  { id: 'pda-derive', title: 'Derive a PDA', description: 'Find a Program Derived Address using seeds and verify it on-chain.', difficulty: 'Beginner', xp: 250, track: 'Solana Core', type: 'daily' },
  { id: 'close-account', title: 'Close an Account', description: 'Implement account closure with proper rent reclamation back to the payer.', difficulty: 'Intermediate', xp: 300, track: 'Solana Core', type: 'daily' },
  { id: 'cpi-call', title: 'Cross-Program Invocation', description: 'Make a CPI call from one Anchor program to another with proper signer seeds.', difficulty: 'Advanced', xp: 500, track: 'Anchor', type: 'daily' },
  { id: 'token-transfer', title: 'Transfer SPL Tokens', description: 'Send SPL tokens between associated token accounts with proper authority signing.', difficulty: 'Intermediate', xp: 350, track: 'Token Program', type: 'daily' },
];

const WEEKLY_CHALLENGES: Challenge[] = [
  { id: 'create-token', title: 'Create an SPL Token', description: 'Implement a function that creates a new SPL token on Solana with configurable decimals.', difficulty: 'Intermediate', xp: 350, track: 'Token Program', type: 'weekly' },
  { id: 'anchor-counter', title: 'Build an Anchor Counter', description: 'Write a simple Anchor program that increments and decrements a counter on-chain.', difficulty: 'Intermediate', xp: 500, track: 'Anchor', type: 'weekly' },
  { id: 'staking-program', title: 'Build a Staking Program', description: 'Create an Anchor program that allows users to stake tokens and earn rewards over time.', difficulty: 'Advanced', xp: 750, track: 'DeFi', type: 'weekly' },
  { id: 'escrow-program', title: 'Build an Escrow', description: 'Implement a trustless escrow program that holds tokens until both parties fulfill conditions.', difficulty: 'Advanced', xp: 800, track: 'Anchor', type: 'weekly' },
];

const SEASONAL: Challenge[] = [
  { id: 'nft-mint', title: 'Mint a Compressed NFT', description: 'Use Metaplex Bubblegum to mint a compressed NFT for cost-efficient on-chain art.', difficulty: 'Advanced', xp: 750, track: 'NFTs / Metaplex', type: 'seasonal', expiresLabel: 'Mar 15' },
];

// Rotate: pick today's daily and this week's weekly
const todaysDaily = ALL_DAILY[DAY_OF_YEAR % ALL_DAILY.length];
const thisWeeksWeekly = WEEKLY_CHALLENGES[WEEK_OF_YEAR % WEEKLY_CHALLENGES.length];

const CHALLENGES: Challenge[] = [
  { ...todaysDaily, expiresLabel: 'Resets daily' },
  { ...thisWeeksWeekly, expiresLabel: 'Resets weekly' },
  ...SEASONAL,
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
          { label: 'Challenges', value: String(ALL_DAILY.length + WEEKLY_CHALLENGES.length + SEASONAL.length) },
          { label: 'Total XP', value: [...ALL_DAILY, ...WEEKLY_CHALLENGES, ...SEASONAL].reduce((a, c) => a + c.xp, 0).toLocaleString() },
          { label: 'Tracks', value: String(new Set([...ALL_DAILY, ...WEEKLY_CHALLENGES, ...SEASONAL].map(c => c.track)).size) },
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">{challenge.track}</span>
                {challenge.type === 'daily' && <span className="rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">Daily</span>}
                {challenge.type === 'weekly' && <span className="rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">Weekly</span>}
                {challenge.type === 'seasonal' && <span className="rounded-full bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">Seasonal</span>}
              </div>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFF_COLORS[challenge.difficulty])}>
                {challenge.difficulty}
              </span>
            </div>

            <h2 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {challenge.title}
            </h2>
            <p className="text-sm text-gray-400 flex-1 mb-4 leading-relaxed">{challenge.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-yellow-300 font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  +{challenge.xp} XP
                </span>
                {challenge.expiresLabel && (
                  <span className="text-[10px] text-gray-500">{challenge.expiresLabel}</span>
                )}
              </div>

              {challenge.comingSoon ? (
                <span className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-500">Coming Soon</span>
              ) : (
                <Link
                  href={localePath(locale, `/challenges/${challenge.id}`)}
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
          <div className="text-sm font-semibold text-white mb-1">Daily &amp; weekly challenge rotation</div>
          <div className="text-xs text-gray-400">
            A new daily challenge appears every day, and weekly challenges rotate each Monday. Seasonal challenges run for limited periods. Complete them all to maximize XP.
          </div>
        </div>
      </div>
    </div>
  );
}
