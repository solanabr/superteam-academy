'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'
import { calculateLevel } from '@/lib/services/interfaces'

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alice.sol', xp: 4200, streak: 14, wallet: '7xKX...m3fR' },
  { rank: 2, name: 'Bob DeFi', xp: 3800, streak: 7, wallet: '9yRT...z4mQ' },
  { rank: 3, name: 'Carlos Dev', xp: 3100, streak: 21, wallet: '3pMN...k8sT' },
  { rank: 4, name: 'Diana.eth', xp: 2500, streak: 3, wallet: '5qWE...n2vR' },
  { rank: 5, name: 'Eduardo Chain', xp: 1900, streak: 10, wallet: '8rTY...p6bX' },
  { rank: 6, name: 'Fernanda NFT', xp: 1600, streak: 5, wallet: '2sUI...m9cZ' },
  { rank: 7, name: 'You (SolDev.sol)', xp: 1850, streak: 5, wallet: '4tOP...q3dA', isUser: true },
  { rank: 8, name: 'Helena Rust', xp: 900, streak: 2, wallet: '6uAS...r7eB' },
  { rank: 9, name: 'Igor Web3', xp: 500, streak: 1, wallet: '1vDF...s4fC' },
  { rank: 10, name: 'Julia Solana', xp: 200, streak: 4, wallet: '0wGH...t8gD' },
].sort((a, b) => b.xp - a.xp).map((e, i) => ({ ...e, rank: i + 1 }))

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('alltime')

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('leaderboard.title')}</h1>

        {/* Timeframe filter */}
        <div className="flex gap-2 mb-6">
          {(['weekly', 'monthly', 'alltime'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeframe === tf ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t(`leaderboard.${tf}`)}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {MOCK_LEADERBOARD.slice(0, 3).map((entry, i) => (
            <div key={entry.rank} className={`text-center p-4 rounded-xl border ${
              i === 0 ? 'bg-yellow-900/20 border-yellow-600/30 order-2' :
              i === 1 ? 'bg-gray-800/50 border-gray-700 order-1' :
              'bg-orange-900/20 border-orange-700/30 order-3'
            }`}>
              <div className="text-3xl mb-2">{medals[i]}</div>
              <div className="font-bold">{entry.name}</div>
              <div className="text-purple-400 font-bold mt-1">{entry.xp.toLocaleString()} XP</div>
              <div className="text-xs text-gray-400">Level {calculateLevel(entry.xp)}</div>
              <div className="text-xs text-orange-400 mt-1">🔥 {entry.streak}d</div>
            </div>
          ))}
        </div>

        {/* Full ranking */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 px-4 py-3 border-b border-gray-800 last:border-0 ${
                (entry as any).isUser ? 'bg-purple-900/20' : ''
              }`}
            >
              <div className={`w-8 text-center font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                {entry.name[0]}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${(entry as any).isUser ? 'text-purple-400' : ''}`}>{entry.name}</div>
                <div className="text-xs text-gray-500 font-mono">{entry.wallet}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-400">{entry.xp.toLocaleString()} XP</div>
                <div className="text-xs text-gray-500">Lv. {calculateLevel(entry.xp)} · 🔥 {entry.streak}d</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
