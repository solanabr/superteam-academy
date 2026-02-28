'use client';

import { useMemo } from 'react';
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

type ChallengeType = 'daily' | 'weekly' | 'seasonal' | 'permanent';

interface Challenge {
  id: string;
  titleKey: string;
  descKey: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  track: string;
  type: ChallengeType;
  comingSoon?: boolean;
  expiresLabelKey?: string;
}

const ALL_DAILY: Omit<Challenge, 'expiresLabelKey'>[] = [
  { id: 'transfer-sol', titleKey: 'ch_transfer_sol', descKey: 'ch_transfer_sol_desc', difficulty: 'Beginner', xp: 200, track: 'Solana Core', type: 'daily' },
  { id: 'read-account', titleKey: 'ch_read_account', descKey: 'ch_read_account_desc', difficulty: 'Beginner', xp: 200, track: 'Solana Core', type: 'daily' },
  { id: 'serialize-ix', titleKey: 'ch_serialize_ix', descKey: 'ch_serialize_ix_desc', difficulty: 'Intermediate', xp: 300, track: 'Solana Core', type: 'daily' },
  { id: 'pda-derive', titleKey: 'ch_pda_derive', descKey: 'ch_pda_derive_desc', difficulty: 'Beginner', xp: 250, track: 'Solana Core', type: 'daily' },
  { id: 'close-account', titleKey: 'ch_close_account', descKey: 'ch_close_account_desc', difficulty: 'Intermediate', xp: 300, track: 'Solana Core', type: 'daily' },
  { id: 'cpi-call', titleKey: 'ch_cpi_call', descKey: 'ch_cpi_call_desc', difficulty: 'Advanced', xp: 500, track: 'Anchor', type: 'daily' },
  { id: 'token-transfer', titleKey: 'ch_token_transfer', descKey: 'ch_token_transfer_desc', difficulty: 'Intermediate', xp: 350, track: 'Token Program', type: 'daily' },
];

const WEEKLY_CHALLENGES: Omit<Challenge, 'expiresLabelKey'>[] = [
  { id: 'create-token', titleKey: 'ch_create_token', descKey: 'ch_create_token_desc', difficulty: 'Intermediate', xp: 350, track: 'Token Program', type: 'weekly' },
  { id: 'anchor-counter', titleKey: 'ch_anchor_counter', descKey: 'ch_anchor_counter_desc', difficulty: 'Intermediate', xp: 500, track: 'Anchor', type: 'weekly' },
  { id: 'staking-program', titleKey: 'ch_staking_program', descKey: 'ch_staking_program_desc', difficulty: 'Advanced', xp: 750, track: 'DeFi', type: 'weekly' },
  { id: 'escrow-program', titleKey: 'ch_escrow_program', descKey: 'ch_escrow_program_desc', difficulty: 'Advanced', xp: 800, track: 'Anchor', type: 'weekly' },
];

const SEASONAL: Challenge[] = [
  { id: 'nft-mint', titleKey: 'ch_nft_mint', descKey: 'ch_nft_mint_desc', difficulty: 'Advanced', xp: 750, track: 'NFTs / Metaplex', type: 'seasonal', expiresLabelKey: 'Mar 15' },
];

const DIFF_KEY: Record<string, string> = {
  Beginner: 'diff_beginner',
  Intermediate: 'diff_intermediate',
  Advanced: 'diff_advanced',
};

export default function ChallengesPage() {
  const t = useTranslations('challenges_page');
  const locale = useLocale();

  // Compute rotation inside component so it stays fresh
  const challenges = useMemo<Challenge[]>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const weekOfYear = Math.ceil(dayOfYear / 7);

    const todaysDaily = ALL_DAILY[dayOfYear % ALL_DAILY.length];
    const thisWeeksWeekly = WEEKLY_CHALLENGES[weekOfYear % WEEKLY_CHALLENGES.length];

    return [
      { ...todaysDaily, expiresLabelKey: 'resets_daily' },
      { ...thisWeeksWeekly, expiresLabelKey: 'resets_weekly' },
      ...SEASONAL,
    ];
  }, []);

  const allChallenges = [...ALL_DAILY, ...WEEKLY_CHALLENGES, ...SEASONAL];
  const totalXP = allChallenges.reduce((a, c) => a + c.xp, 0);
  const trackCount = new Set(allChallenges.map(c => c.track)).size;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-3">
          <Code2 className="h-4 w-4" />
          <span>Superteam Academy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">{t('title')}</h1>
        <p className="text-gray-400 max-w-xl">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: t('stats_challenges'), value: String(allChallenges.length) },
          { label: t('stats_total_xp'), value: totalXP.toLocaleString() },
          { label: t('stats_tracks'), value: String(trackCount) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="text-2xl font-extrabold text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {challenges.map((challenge) => (
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
                <span className="text-xs text-gray-400 font-medium">{challenge.track}</span>
                {challenge.type === 'daily' && <span className="rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">{t('badge_daily')}</span>}
                {challenge.type === 'weekly' && <span className="rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">{t('badge_weekly')}</span>}
                {challenge.type === 'seasonal' && <span className="rounded-full bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 text-[10px] font-bold uppercase">{t('badge_seasonal')}</span>}
              </div>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFF_COLORS[challenge.difficulty])}>
                {t(DIFF_KEY[challenge.difficulty])}
              </span>
            </div>

            <h2 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {t(challenge.titleKey)}
            </h2>
            <p className="text-sm text-gray-400 flex-1 mb-4 leading-relaxed">{t(challenge.descKey)}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-yellow-300 font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  +{challenge.xp} XP
                </span>
                {challenge.expiresLabelKey && (
                  <span className="text-[10px] text-gray-400">
                    {challenge.expiresLabelKey === 'resets_daily' || challenge.expiresLabelKey === 'resets_weekly'
                      ? t(challenge.expiresLabelKey)
                      : challenge.expiresLabelKey}
                  </span>
                )}
              </div>

              {challenge.comingSoon ? (
                <span className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400">{t('coming_soon')}</span>
              ) : (
                <Link
                  href={localePath(locale, `/challenges/${challenge.id}`)}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all"
                >
                  {t('start')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rotation banner */}
      <div className="mt-8 rounded-2xl border border-purple-800/30 bg-purple-900/10 p-5 flex items-center gap-4">
        <Trophy className="h-8 w-8 text-purple-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white mb-1">{t('rotation_title')}</div>
          <div className="text-xs text-gray-400">{t('rotation_desc')}</div>
        </div>
      </div>
    </div>
  );
}
