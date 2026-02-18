'use client'

import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'
import { calculateLevel, levelProgress } from '@/lib/services/interfaces'

const MOCK_XP = 1850
const MOCK_STREAK = 5

const MOCK_COURSES = [
  { slug: 'intro-solana', title: 'Introdução ao Solana', icon: '☀️', progress: 75, nextLesson: 'Tokens SPL' },
  { slug: 'anchor-contracts', title: 'Smart Contracts com Anchor', icon: '⚓', progress: 30, nextLesson: 'Anatomia de um Programa' },
  { slug: 'defi-pratica', title: 'DeFi na Prática', icon: '💰', progress: 0, nextLesson: 'O que é um AMM?' },
]

const MOCK_ACTIVITY = [
  { text: 'Completou: O que é Proof of History?', time: '2h atrás', xp: '+25 XP' },
  { text: 'Quiz aprovado: Fundamentos Solana', time: '3h atrás', xp: '+50 XP' },
  { text: 'Streak bonus! 5 dias consecutivos 🔥', time: '1d atrás', xp: '+10 XP' },
  { text: 'Inscrito: DeFi na Prática', time: '2d atrás', xp: '' },
]

const MOCK_ACHIEVEMENTS = [
  { icon: '🌱', name: 'Primeiros Passos', unlocked: true },
  { icon: '🔥', name: 'Semana Guerreira', unlocked: true },
  { icon: '🦀', name: 'Rust Rookie', unlocked: false },
  { icon: '⭐', name: 'Early Adopter', unlocked: true },
  { icon: '💯', name: 'Nota Perfeita', unlocked: false },
  { icon: '🏃', name: 'Speed Runner', unlocked: false },
]

export default function DashboardPage() {
  const { t } = useI18n()
  const level = calculateLevel(MOCK_XP)
  const progress = levelProgress(MOCK_XP)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('dashboard.title')}</h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-sm text-gray-400">{t('dashboard.xp')}</div>
            <div className="text-2xl font-bold text-purple-400">{MOCK_XP.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-sm text-gray-400">{t('dashboard.level')}</div>
            <div className="text-2xl font-bold">{level}</div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-sm text-gray-400">{t('dashboard.streak')}</div>
            <div className="text-2xl font-bold text-orange-400">{MOCK_STREAK} 🔥</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-sm text-gray-400">{t('leaderboard.rank')}</div>
            <div className="text-2xl font-bold">#7</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">{t('dashboard.my_courses')}</h2>
            {MOCK_COURSES.map((c) => (
              <Link key={c.slug} href={`/courses/${c.slug}`} className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{c.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    <div className="text-sm text-gray-400 mt-1">{t('dashboard.next_lesson')}: {c.nextLesson}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                      </div>
                      <span className="text-sm text-gray-400">{c.progress}%</span>
                    </div>
                  </div>
                  <span className="text-purple-400 text-sm">{c.progress > 0 ? t('courses.continue') : t('courses.enroll')} →</span>
                </div>
              </Link>
            ))}

            {/* Recommended */}
            <h2 className="text-xl font-bold mt-8">{t('dashboard.recommended')}</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Marketplace de NFTs', icon: '🎨', xp: 800 },
                { title: 'Frontend Web3', icon: '🖥️', xp: 600 },
              ].map((c, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition cursor-pointer">
                  <span className="text-2xl">{c.icon}</span>
                  <h3 className="font-semibold mt-2">{c.title}</h3>
                  <span className="text-xs text-purple-400">+{c.xp} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Calendar (simplified) */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="font-semibold mb-3">{t('dashboard.streak')} 🔥</h3>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const active = i >= 23 // last 5 days
                  return (
                    <div key={i} className={`w-full aspect-square rounded-sm ${active ? 'bg-green-500' : 'bg-gray-800'}`} />
                  )
                })}
              </div>
              <div className="text-center text-sm text-gray-400 mt-2">{MOCK_STREAK} {t('dashboard.days')} consecutivos</div>
            </div>

            {/* Achievements */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="font-semibold mb-3">{t('dashboard.achievements')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {MOCK_ACHIEVEMENTS.map((a, i) => (
                  <div key={i} className={`text-center p-2 rounded-lg ${a.unlocked ? 'bg-gray-800' : 'bg-gray-800/50 opacity-40'}`}>
                    <div className="text-2xl">{a.icon}</div>
                    <div className="text-xs mt-1 text-gray-400">{a.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="font-semibold mb-3">{t('dashboard.recent_activity')}</h3>
              <div className="space-y-3">
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start justify-between text-sm">
                    <div>
                      <div className="text-gray-300">{a.text}</div>
                      <div className="text-xs text-gray-500">{a.time}</div>
                    </div>
                    {a.xp && <span className="text-purple-400 text-xs whitespace-nowrap">{a.xp}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
