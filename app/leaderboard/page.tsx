'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { useLeaderboard } from '@/lib/hooks/useProgress'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { useMemo, useState } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { PublicKey } from '@solana/web3.js'
import { useXPBalance } from '@/lib/hooks/useXPBalance'
import { calculateLevel } from '@/lib/types'

export default function LeaderboardPage() {
  const { t } = useI18n()
  const { connected, publicKey, walletAddress } = useWallet()
  const { leaderboard, loading } = useLeaderboard()
  const [timeframe] = useState<'weekly' | 'monthly' | 'alltime'>('alltime')
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
  const currentUserEntry = leaderboard.find((entry) => {
    if (!walletAddress) return false
    const candidate = (entry.wallet || entry.userId || '').toLowerCase()
    return candidate === walletAddress.toLowerCase()
  })

  return (
    <main className="min-h-screen py-12 bg-gray-50 dark:bg-inherit">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-blue-600 dark:text-neon-cyan mb-2">
            {t('leaderboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('leaderboard.subtitle')}</p>
        </div>

        {/* Timeframe Tabs - Coming Soon */}
        <div className="flex gap-2 mb-8">
          {(['weekly', 'monthly', 'alltime'] as const).map((tf) => (
            <button
              key={tf}
              disabled={tf !== 'alltime'}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 dark:bg-neon-cyan text-white dark:text-terminal-bg'
                  : 'bg-gray-100 dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed'
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

        {/* User's Current Rank */}
        {connected && (
          <Card className="mb-8 border-2 border-blue-600 dark:border-neon-cyan">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('leaderboard.yourRank')}</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-neon-cyan">
                    {currentUserEntry ? `# ${currentUserEntry.rank}` : t('leaderboard.notInTop')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{walletXp.toLocaleString()} XP</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Level {walletLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{t('leaderboard.topDevelopers')}</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? t('common.loading') : `${leaderboard.length} ${t('leaderboard.developers')}`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!loading && leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-terminal-border text-left text-sm text-gray-600 dark:text-gray-400">
                      <th className="pb-3 px-3 w-16">{t('leaderboard.rank')}</th>
                      <th className="pb-3 px-3">{t('leaderboard.username')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.xp')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.level')}</th>
                      <th className="pb-3 px-3 text-right">{t('leaderboard.streak')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => {
                      const wallet = (entry.wallet || entry.userId || '').toLowerCase()
                      const isCurrentUser = !!walletAddress && wallet === walletAddress.toLowerCase()
                      return (
                        <tr
                          key={entry.userId}
                          className={`border-b border-gray-300 dark:border-terminal-border transition-colors ${
                            isCurrentUser
                              ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                              : 'hover:bg-gray-100 dark:hover:bg-terminal-surface'
                          }`}
                        >
                          <td className="py-4 px-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 dark:bg-neon-cyan text-white dark:text-terminal-bg font-bold text-sm">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                                {(entry.displayName || 'User')[0].toUpperCase()}
                              </span>
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {entry.displayName || 'Anonymous'}
                                </span>
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-blue-600 dark:bg-neon-cyan text-white dark:text-terminal-bg px-2 py-0.5 rounded">
                                    {t('leaderboard.you')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-right text-blue-600 dark:text-neon-cyan font-semibold">
                            {entry.totalXp.toLocaleString()}
                          </td>
                          <td className="py-4 px-3 text-right text-green-600 dark:text-neon-green font-semibold">
                            {entry.level}
                          </td>
                          <td className="py-4 px-3 text-right text-orange-600 dark:text-orange-400">
                            🔥 {entry.currentStreak}
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
                  <div key={i} className="h-16 bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p>{t('leaderboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
