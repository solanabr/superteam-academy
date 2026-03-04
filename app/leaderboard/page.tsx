'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { useLeaderboard } from '@/lib/hooks/useProgress'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { useMemo, useState } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { PublicKey } from '@solana/web3.js'
import { useXPBalance } from '@/lib/hooks/useXPBalance'
import { calculateLevel } from '@/lib/types'
import { Crown, Flame, Medal, Trophy, Zap } from 'lucide-react'

type Timeframe = 'weekly' | 'monthly' | 'alltime'

function formatWalletAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function getInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : 'U'
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'border-amber-300 bg-amber-100 text-amber-800 dark:border-superteam-yellow/55 dark:bg-superteam-yellow/20 dark:text-superteam-yellow'
  if (rank === 2) return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-300/60 dark:bg-slate-300/15 dark:text-slate-200'
  if (rank === 3) return 'border-orange-300 bg-orange-100 text-orange-700 dark:border-amber-700/55 dark:bg-amber-700/15 dark:text-amber-300'
  return 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-superteam-emerald/30 dark:bg-superteam-emerald/12 dark:text-superteam-offwhite'
}

function getPodiumCardClass(rank: number): string {
  if (rank === 1) {
    return 'border-amber-300 bg-gradient-to-b from-amber-100 via-amber-50 to-white shadow-sm dark:border-superteam-yellow/45 dark:from-superteam-yellow/18 dark:via-superteam-navy/45 dark:to-[#0a152d] dark:shadow-none'
  }
  if (rank === 2) {
    return 'border-slate-300 bg-gradient-to-b from-slate-100 via-slate-50 to-white shadow-sm dark:border-slate-300/35 dark:from-slate-400/12 dark:via-superteam-navy/45 dark:to-[#0a152d] dark:shadow-none'
  }
  if (rank === 3) {
    return 'border-orange-300 bg-gradient-to-b from-orange-100 via-orange-50 to-white shadow-sm dark:border-amber-700/35 dark:from-amber-700/12 dark:via-superteam-navy/45 dark:to-[#0a152d] dark:shadow-none'
  }
  return 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-white shadow-sm dark:border-superteam-emerald/25 dark:bg-[#0b1830] dark:shadow-none'
}

export default function LeaderboardPage() {
  const { t } = useI18n()
  const { connected, publicKey, walletAddress } = useWallet()
  const { leaderboard, loading, error } = useLeaderboard()
  const [timeframe] = useState<Timeframe>('alltime')
  const xpMint = useMemo(() => {
    const mintStr = process.env.NEXT_PUBLIC_XP_TOKEN_MINT
    if (!mintStr) return undefined
    try {
      return new PublicKey(mintStr)
    } catch {
      return undefined
    }
  }, [])
  const { balance: walletXp } = useXPBalance(publicKey || undefined, xpMint)
  const walletLevel = calculateLevel(walletXp)

  const normalizedLeaderboard = useMemo(() => {
    return [...leaderboard]
      .map((entry, idx) => ({
        ...entry,
        rank: entry.rank > 0 ? entry.rank : idx + 1,
      }))
      .sort((a, b) => a.rank - b.rank)
  }, [leaderboard])

  const currentUserEntry = normalizedLeaderboard.find((entry) => {
    if (!walletAddress) return false
    const candidate = (entry.wallet || entry.userId || '').toLowerCase()
    return candidate === walletAddress.toLowerCase()
  })
  const topThree = normalizedLeaderboard.slice(0, 3)
  const topXp = normalizedLeaderboard[0]?.totalXp ?? 0
  const averageXp = normalizedLeaderboard.length
    ? Math.round(normalizedLeaderboard.reduce((sum, entry) => sum + entry.totalXp, 0) / normalizedLeaderboard.length)
    : 0

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl dark:bg-superteam-emerald/15" />
      <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-superteam-navy/20" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-superteam-yellow/10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-white via-slate-50 to-emerald-50/70 p-6 shadow-sm backdrop-blur-sm dark:border-superteam-emerald/30 dark:bg-gradient-to-r dark:from-[#111e3a] dark:via-[#152345] dark:to-[#1a2849] dark:shadow-none">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-superteam-yellow/40 bg-superteam-yellow/15 px-3 py-1 text-xs font-semibold tracking-wide text-superteam-forest dark:text-superteam-yellow">
            <Trophy size={14} />
            {t('leaderboard.allTime').toUpperCase()} XP
          </div>
          <h1 className="mb-2 text-4xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
            {t('leaderboard.title')}
          </h1>
          <p className="text-slate-600 dark:text-gray-300">{t('leaderboard.subtitle')}</p>
        </div>

        {/* Timeframe Tabs - Coming Soon */}
        <div className="mb-8 flex gap-2">
          {(['weekly', 'monthly', 'alltime'] as const).map((tf: Timeframe) => (
            <button
              key={tf}
              disabled={tf !== 'alltime'}
              className={`rounded-lg border px-5 py-2 font-semibold transition-all duration-200 ${
                timeframe === tf
                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm dark:border-superteam-emerald/45 dark:bg-superteam-emerald/20 dark:text-superteam-emerald dark:shadow-none'
                  : tf !== 'alltime'
                  ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 dark:border-superteam-navy/50 dark:bg-superteam-navy/25 dark:text-slate-400'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-superteam-navy/40 dark:bg-superteam-navy/30 dark:text-gray-300 dark:hover:border-superteam-yellow/45'
              }`}
            >
              {tf === 'weekly'
                ? t('leaderboard.weekly')
                : tf === 'monthly'
                ? t('leaderboard.monthly')
                  : t('leaderboard.allTime')}
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card hover={false} className="border-emerald-300/60 bg-white/95 shadow-sm dark:border-superteam-emerald/30 dark:bg-[#0f1b35]/80 dark:shadow-none">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('leaderboard.topDevelopers')}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-superteam-offwhite">{normalizedLeaderboard.length}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{t('leaderboard.developers')}</p>
            </CardContent>
          </Card>
          <Card hover={false} className="border-amber-300/60 bg-white/95 shadow-sm dark:border-superteam-yellow/35 dark:bg-[#0f1b35]/80 dark:shadow-none">
            <CardContent className="pt-6">
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                <Zap size={12} />
                {t('leaderboard.xp')}
              </p>
              <p className="mt-2 text-3xl font-bold text-superteam-forest dark:text-superteam-yellow">{topXp.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">~ {averageXp.toLocaleString()} XP</p>
            </CardContent>
          </Card>
          <Card hover={false} className="border-blue-300/60 bg-white/95 shadow-sm dark:border-superteam-navy/40 dark:bg-[#0f1b35]/80 dark:shadow-none sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{t('leaderboard.yourRank')}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-superteam-offwhite">
                {connected ? (currentUserEntry ? `#${currentUserEntry.rank}` : t('leaderboard.notInTop')) : '--'}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{walletXp.toLocaleString()} XP • Level {walletLevel}</p>
            </CardContent>
          </Card>
        </div>

        {/* User's Current Rank */}
        {connected && (
          <Card className="mb-8 overflow-hidden border-2 border-emerald-300 bg-white/95 shadow-sm dark:border-superteam-emerald/45 dark:bg-[#0f1b35]/80 dark:shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{t('leaderboard.yourRank')}</p>
                  <p className="text-3xl font-bold text-superteam-forest dark:text-superteam-emerald">
                    {currentUserEntry ? `# ${currentUserEntry.rank}` : t('leaderboard.notInTop')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-superteam-offwhite">{walletXp.toLocaleString()} XP</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">Level {walletLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && topThree.length > 0 && (
          <Card className="mb-8 border-blue-300/60 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0f1b35]/80 dark:shadow-none">
            <CardHeader>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                Top 3
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {topThree.map((entry) => {
                  const rank = entry.rank
                  const name = entry.displayName || entry.username || 'Anonymous'
                  const wallet = entry.wallet || entry.userId || ''
                  const showWallet = wallet.length > 0

                  return (
                    <div
                      key={`${entry.userId}-${rank}`}
                      className={`rounded-xl border p-4 ${getPodiumCardClass(rank)}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${getRankBadgeClass(rank)}`}>
                          {rank === 1 ? <Crown size={16} /> : rank === 2 ? <Medal size={16} /> : <Trophy size={16} />}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-gray-300">#{rank}</span>
                      </div>
                      <p className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">{name}</p>
                      {showWallet && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{formatWalletAddress(wallet)}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-superteam-forest dark:text-superteam-yellow">{entry.totalXp.toLocaleString()} XP</span>
                        <span className="text-slate-800 dark:text-superteam-emerald">L{entry.level}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card className="border-blue-300/60 bg-white/95 shadow-sm dark:border-superteam-navy/40 dark:bg-[#0f1b35]/80 dark:shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">{t('leaderboard.topDevelopers')}</h2>
              <span className="text-sm text-slate-600 dark:text-gray-300">
                {loading ? t('common.loading') : `${normalizedLeaderboard.length} ${t('leaderboard.developers')}`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!loading && normalizedLeaderboard.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-blue-300/60 bg-white dark:border-superteam-navy/35 dark:bg-[#0a1327]">
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="border-b border-blue-300/60 bg-slate-100/95 text-left text-sm text-slate-700 backdrop-blur-sm dark:border-superteam-navy/35 dark:bg-superteam-navy/55 dark:text-gray-300">
                      <th className="pb-3 px-3 w-16">{t('leaderboard.rank')}</th>
                      <th className="pb-3 px-3">{t('leaderboard.username')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.xp')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.level')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.streak')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedLeaderboard.map((entry) => {
                      const wallet = (entry.wallet || entry.userId || '').toLowerCase()
                      const isCurrentUser = !!walletAddress && wallet === walletAddress.toLowerCase()
                      const rank = entry.rank
                      const name = entry.displayName || entry.username || 'Anonymous'
                      const displayWallet = entry.wallet || entry.userId || ''
                      return (
                        <tr
                          key={`${entry.userId}-${rank}`}
                          className={`border-b border-slate-200 transition-colors dark:border-superteam-navy/25 ${
                            isCurrentUser
                              ? 'bg-emerald-100/80 hover:bg-emerald-100 dark:bg-superteam-emerald/10 dark:hover:bg-superteam-emerald/20'
                              : 'hover:bg-slate-100 dark:hover:bg-superteam-navy/25'
                          }`}
                        >
                          <td className="py-4 px-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${getRankBadgeClass(rank)}`}>
                              {rank}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-superteam-emerald to-superteam-navy text-sm font-bold text-white">
                                {getInitial(name)}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {name}
                                </span>
                                {displayWallet && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatWalletAddress(displayWallet)}</p>
                                )}
                                {isCurrentUser && (
                                  <span className="ml-2 rounded bg-superteam-emerald/20 px-2 py-0.5 text-xs text-superteam-forest dark:text-superteam-emerald">
                                    {t('leaderboard.you')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-right font-semibold text-superteam-forest dark:text-superteam-yellow">
                            {entry.totalXp.toLocaleString()}
                          </td>
                          <td className="py-4 px-3 text-right font-semibold text-superteam-navy dark:text-superteam-emerald">
                            {entry.level}
                          </td>
                          <td className="py-4 px-3 text-right text-orange-600 dark:text-orange-300">
                            <span className="inline-flex items-center gap-1">
                              <Flame size={14} />
                              {entry.currentStreak}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-terminal-bg" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-400/40 bg-red-100/60 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p className="text-slate-600 dark:text-gray-400">{t('leaderboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
