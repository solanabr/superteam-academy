'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { useSession } from 'next-auth/react'
import { useGamification } from '@/lib/hooks/useGamification'
import { useAchievements } from '@/lib/hooks/useAchievements'
import { Card, CardContent, CardHeader, Button } from '@/components/ui'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { calculateLevel } from '@/lib/types'
import { useWallet } from '@/lib/hooks/useWallet'
import { useXPBalance } from '@/lib/hooks/useXPBalance'
import { useCredentials } from '@/lib/hooks/useXp'
import { getAchievementServiceInstance } from '@/lib/services/achievement.service'
import { SkillRadar, demoSkillData, calculateSkillsFromProgress } from '@/components/profile'
import { Achievement } from '@/lib/types'
import { Award, CalendarClock, Flame, PencilLine, ShieldCheck, Sparkles, Wallet } from 'lucide-react'

interface ProfileUser {
  id: string
  email?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  age?: number | null
  walletAddress?: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  createdAt: string
}

function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function ProfilePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const { connected, publicKey, openWalletModal } = useWallet()
  const rawUserId = session?.user?.id || session?.user?.email || null
  const userId = typeof rawUserId === 'string' && rawUserId.includes('@') ? rawUserId.toLowerCase() : rawUserId
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [bioBuffer, setBioBuffer] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const xpMint = useMemo(() => {
    const mintStr = process.env.NEXT_PUBLIC_XP_TOKEN_MINT
    if (!mintStr) return undefined
    try {
      return new PublicKey(mintStr)
    } catch {
      return undefined
    }
  }, [])
  const { balance: onChainXp } = useXPBalance(publicKey || undefined, xpMint)
  const { data: credentials = [], isLoading: credentialsLoading } = useCredentials(publicKey || undefined)
  const { stats, loading: statsLoading } = useGamification(undefined, { userId })
  const offChainXp = Math.max(stats?.totalXP ?? 0, user?.totalXP ?? 0)
  const totalXp = connected ? Math.max(offChainXp, onChainXp) : offChainXp
  const level = Math.max(stats?.level ?? user?.level ?? 0, calculateLevel(totalXp))

  const completedCourses = 0
  const lessonsCompleted = stats?.lessonsCompleted ?? 0
  const skillData = useMemo(() => {
    if (lessonsCompleted > 0 || completedCourses > 0) {
      return calculateSkillsFromProgress(completedCourses, lessonsCompleted)
    }
    return demoSkillData
  }, [completedCourses, lessonsCompleted])

  const { unlockedAchievements } = useAchievements({
    userId: userId || 'guest',
    stats: {
      totalXp,
      totalLessonsCompleted: lessonsCompleted,
      totalCoursesCompleted: completedCourses,
      currentStreak: stats?.currentStreak || 0,
      lessonsCompletedToday: stats?.lessonsCompletedToday || 0,
    },
  })
  const achievements = useMemo(() => getAchievementServiceInstance().getAllAchievements(), [])
  const achievementsLoading = statsLoading

  useEffect(() => {
    let cancelled = false

    const fetchProfile = async () => {
      if (!userId) {
        setUser(null)
        setBioBuffer('')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }
        const data = await response.json()
        if (cancelled) return
        setUser(data)
        setBioBuffer(data?.bio || '')
      } catch (error) {
        console.error('Failed to load profile:', error)
        if (cancelled) return
        setUser({
          id: userId,
          email: session?.user?.email || undefined,
          displayName: session?.user?.name || 'Anonymous Learner',
          bio: '',
          avatarUrl: session?.user?.image || undefined,
          age: null,
          walletAddress: undefined,
          totalXP: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
        })
        setBioBuffer('')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchProfile()

    return () => {
      cancelled = true
    }
  }, [userId, session?.user?.email, session?.user?.image, session?.user?.name])

  const handleSaveBio = async () => {
    if (!user || !userId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bioBuffer }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }

      const updated = await response.json()
      setUser(updated)
      setBioBuffer(updated?.bio || '')
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save bio:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 h-56 animate-pulse rounded-2xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30" />
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3 h-72 animate-pulse rounded-2xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30" />
            <div className="xl:col-span-2 h-72 animate-pulse rounded-2xl border border-slate-200 bg-white/90 dark:border-superteam-navy/40 dark:bg-superteam-navy/30" />
          </div>
        </div>
      </main>
    )
  }

  if (status !== 'authenticated' || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none">
            <CardContent className="py-12">
              <h1 className="mb-3 text-4xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                {t('profile.notFound')}
              </h1>
              <p className="mb-6 text-slate-600 dark:text-gray-300">{t('profile.signInToView')}</p>
              <Link href="/auth/signin">
                <Button>{t('auth.signIn')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const streak = stats?.currentStreak ?? user.currentStreak ?? 0
  const longestStreak = stats?.longestStreak ?? user.longestStreak ?? 0
  const memberSince = user.createdAt ? new Date(user.createdAt) : null
  const daysSinceJoin = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)) : null
  const displayName = user.displayName || session?.user?.name || t('profile.anonymousLearner')
  const walletAddress = publicKey?.toBase58() || user.walletAddress || ''

  const statCards = [
    {
      label: t('dashboard.stats.level'),
      value: String(level),
      className: 'text-blue-700 dark:text-neon-cyan',
      icon: <Sparkles size={14} />,
    },
    {
      label: t('profile.totalXp'),
      value: totalXp.toLocaleString(),
      className: 'text-superteam-forest dark:text-superteam-yellow',
      icon: <Award size={14} />,
    },
    {
      label: t('dashboard.stats.streak'),
      value: String(streak),
      className: 'text-orange-600 dark:text-orange-300',
      icon: <Flame size={14} />,
    },
    {
      label: t('profile.longest'),
      value: String(longestStreak),
      className: 'text-emerald-700 dark:text-emerald-300',
      icon: <ShieldCheck size={14} />,
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-superteam-emerald/10" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-superteam-navy/25" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="mb-6 border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white shadow-sm dark:border-superteam-emerald/40 dark:shadow-none">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="md:hidden">
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">{displayName}</h1>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{user.email || session?.user?.email || t('profile.noEmail')}</p>
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-4 hidden md:block">
                  <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">{displayName}</h1>
                  <p className="text-slate-600 dark:text-gray-300">{user.email || session?.user?.email || t('profile.noEmail')}</p>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 dark:border-superteam-emerald/45 dark:bg-superteam-emerald/10 dark:text-superteam-emerald">
                    <CalendarClock size={12} />
                    {memberSince ? memberSince.toLocaleDateString() : t('profile.unknown')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 font-semibold text-blue-800 dark:border-superteam-navy/60 dark:bg-superteam-navy/35 dark:text-superteam-offwhite">
                    <Wallet size={12} />
                    {walletAddress ? formatAddress(walletAddress) : t('profile.notSet')}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mb-4">
                    <textarea
                      value={bioBuffer}
                      onChange={(e) => setBioBuffer(e.target.value)}
                      className="min-h-[88px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 dark:border-superteam-navy/55 dark:bg-[#07132a] dark:text-gray-100 dark:focus:border-superteam-emerald"
                      placeholder={t('profile.writeBio')}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleSaveBio} disabled={isSaving}>
                        {isSaving ? t('common.savingEllipsis') : t('common.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false)
                          setBioBuffer(user.bio || '')
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="mb-2 text-slate-700 dark:text-gray-200">{user.bio || t('profile.noBioYet')}</p>
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setBioBuffer(user.bio || '')
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-600 hover:underline dark:text-neon-cyan dark:hover:text-neon-cyan/80"
                    >
                      <PencilLine size={13} />
                      {t('profile.editBio')}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/settings">
                    <Button variant="secondary">{t('profile.editProfile')}</Button>
                  </Link>
                  {!connected && (
                    <Button variant="ghost" onClick={openWalletModal}>
                      {t('common.connectWallet')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              hover={false}
              className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-superteam-navy/35 dark:shadow-none"
            >
              <CardContent className="pt-6">
                <p className="mb-2 inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                  {card.icon}
                  {card.label}
                </p>
                <p className={`text-2xl font-display font-bold ${card.className}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-3">
            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
              <CardHeader>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {t('profile.achievements')} ({unlockedAchievements.length}/{achievements.length})
                </h2>
              </CardHeader>
              <CardContent>
                {!achievementsLoading ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {achievements.map((achievement: Achievement) => {
                      const isUnlocked = unlockedAchievements.some((a) => a.id === achievement.id)
                      return (
                        <div
                          key={achievement.id}
                          title={achievement.title}
                          className={`aspect-square rounded-xl border-2 text-2xl transition-all ${
                            isUnlocked
                              ? 'border-amber-300 bg-amber-50 shadow-sm hover:scale-105 dark:border-amber-500/60 dark:bg-amber-900/20 dark:shadow-none'
                              : 'border-slate-300 bg-slate-100 opacity-60 dark:border-superteam-navy/55 dark:bg-[#091226]'
                          } flex items-center justify-center`}
                        >
                          {achievement.icon || '🏅'}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-square animate-pulse rounded-xl border border-slate-300 bg-slate-100 dark:border-superteam-navy/55 dark:bg-[#091226]" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
              <CardHeader>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  Skill Map
                </h2>
              </CardHeader>
              <CardContent>
                <SkillRadar data={skillData} size="small" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:col-span-2">
            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
              <CardHeader>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {t('profile.credentials')}
                </h2>
              </CardHeader>
              <CardContent>
                {!connected && (
                  <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
                    <p>{t('profile.connectForCredentials')}</p>
                    <Button variant="secondary" onClick={openWalletModal}>
                      {t('common.connectWallet')}
                    </Button>
                  </div>
                )}

                {connected && credentialsLoading && (
                  <p className="text-sm text-slate-600 dark:text-gray-300">{t('profile.loadingCredentials')}</p>
                )}

                {connected && !credentialsLoading && credentials.length === 0 && (
                  <p className="text-sm text-slate-600 dark:text-gray-300">{t('profile.noCredentials')}</p>
                )}

                {connected && !credentialsLoading && credentials.length > 0 && (
                  <div className="space-y-3">
                    {credentials.map((credential) => (
                      <div
                        key={credential.assetId}
                        className="rounded-xl border border-slate-300 bg-slate-50 p-3 dark:border-superteam-navy/55 dark:bg-[#091226]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{credential.name}</p>
                            <p className="text-xs text-slate-600 dark:text-gray-400">
                              {t('profile.track')} {credential.trackId} · {t('dashboard.stats.level')} {credential.level}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-gray-400">
                              {credential.coursesCompleted} {t('courses.lessons')} · {credential.totalXp} XP
                            </p>
                          </div>
                          <Link
                            href={`/certificates/${credential.assetId}`}
                            className="text-sm font-medium text-blue-700 hover:underline dark:text-neon-cyan"
                          >
                            {t('profile.view')}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-300 bg-white/95 shadow-sm dark:border-superteam-navy/45 dark:bg-[#0c1730]/85 dark:shadow-none">
              <CardHeader>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-superteam-offwhite">
                  {t('profile.memberSince')}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-slate-800 dark:text-gray-200">
                  {memberSince ? memberSince.toLocaleDateString() : t('profile.unknown')}
                </p>
                {daysSinceJoin !== null && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
                    {t('profile.joinedDaysAgo').replace('{days}', String(daysSinceJoin))}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
