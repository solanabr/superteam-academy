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

export default function ProfilePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const { connected, publicKey, openWalletModal } = useWallet()
  const rawUserId =
    session?.user?.id || session?.user?.email || null
  const userId =
    typeof rawUserId === 'string' && rawUserId.includes('@')
      ? rawUserId.toLowerCase()
      : rawUserId
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
  const { unlockedAchievements } = useAchievements({
    userId: userId || 'guest',
    stats: {
      totalXp,
      totalLessonsCompleted: stats?.lessonsCompleted || 0,
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
      <main className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-40 bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (status !== 'authenticated' || !user) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-display font-bold mb-4">{t('profile.notFound')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('profile.signInToView')}</p>
          <Link href="/auth/signin">
            <Button>{t('auth.signIn')}</Button>
          </Link>
        </div>
      </main>
    )
  }

  const streak = stats?.currentStreak ?? user.currentStreak ?? 0
  const longestStreak = stats?.longestStreak ?? user.longestStreak ?? 0
  const memberSince = user.createdAt ? new Date(user.createdAt) : null

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-8 pt-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl font-bold text-white">
              {(user?.displayName || 'U')[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName || session?.user?.name || t('profile.anonymousLearner')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email || session?.user?.email || t('profile.noEmail')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('profile.age')}: {typeof user.age === 'number' ? user.age : t('profile.notSet')}
              </p>
              
              {isEditing ? (
                <div className="mb-4">
                  <textarea
                    value={bioBuffer}
                    onChange={(e) => setBioBuffer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-terminal-border rounded-lg dark:bg-terminal-bg dark:text-white text-sm"
                    rows={2}
                    placeholder={t('profile.writeBio')}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveBio}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {isSaving ? t('common.savingEllipsis') : t('common.save')}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setBioBuffer(user.bio || '')
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-terminal-bg text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-terminal-surface text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {user.bio || t('profile.noBioYet')}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setBioBuffer(user.bio || '')
                    }}
                    className="text-blue-600 dark:text-neon-cyan hover:underline text-sm mb-4"
                  >
                    {t('profile.editBio')}
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.stats.level')}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">{level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile.totalXp')}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">
                    {totalXp.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.stats.streak')}</p>
                  <p className="text-2xl font-bold text-orange-500">🔥 {streak}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile.longest')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {longestStreak}
                  </p>
                </div>
              </div>

              <Link href="/settings">
                <Button variant="secondary">{t('profile.editProfile')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                {t('profile.achievements')} ({unlockedAchievements.length}/{achievements.length})
              </h2>
            </CardHeader>
            <CardContent>
              {!achievementsLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {achievements.map((achievement: Achievement) => {
                    const isUnlocked = unlockedAchievements.some((a) => a.id === achievement.id)
                    return (
                      <div
                        key={achievement.id}
                        title={achievement.title}
                        className={`aspect-square rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                          isUnlocked
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 cursor-pointer hover:scale-110'
                            : 'bg-gray-100 dark:bg-terminal-bg border-gray-300 dark:border-terminal-border opacity-50'
                        }`}
                      >
                        {achievement.icon || '🏅'}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                {t('profile.credentials')}
              </h2>
            </CardHeader>
            <CardContent>
              {!connected && (
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('profile.connectForCredentials')}</p>
                  <Button variant="secondary" onClick={openWalletModal}>
                    {t('common.connectWallet')}
                  </Button>
                </div>
              )}

              {connected && credentialsLoading && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.loadingCredentials')}</p>
              )}

              {connected && !credentialsLoading && credentials.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('profile.noCredentials')}
                </p>
              )}

              {connected && !credentialsLoading && credentials.length > 0 && (
                <div className="space-y-3">
                  {credentials.map((credential) => (
                    <div
                      key={credential.assetId}
                      className="rounded-lg border border-terminal-border p-3 bg-gray-100 dark:bg-terminal-bg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{credential.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t('profile.track')} {credential.trackId} · {t('dashboard.stats.level')} {credential.level}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {credential.coursesCompleted} {t('courses.lessons')} · {credential.totalXp} XP
                          </p>
                        </div>
                        <Link
                          href={`/certificates/${credential.assetId}`}
                          className="text-sm text-blue-600 dark:text-neon-cyan hover:underline"
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
        </div>

        {/* Member Since */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
              {t('profile.memberSince')}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 dark:text-gray-300">
              <p>{memberSince ? memberSince.toLocaleDateString() : t('profile.unknown')}</p>
              {memberSince && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('profile.joinedDaysAgo').replace('{days}', String(Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))))}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
