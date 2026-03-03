'use client'

import { useSession } from 'next-auth/react'
import { useGamification } from '@/lib/hooks/useGamification'
import { useAchievements } from '@/lib/hooks/useAchievements'
import { Card, Button } from '@/components/ui'
import { AchievementGrid, AchievementNotification } from '@/components/achievements'
import Link from 'next/link'
import { useI18n } from '@/lib/hooks/useI18n'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'
import { PublicKey } from '@solana/web3.js'
import { useXPBalance } from '@/lib/hooks/useXPBalance'
import { calculateLevel, Course as CatalogCourse } from '@/lib/types'
import { getCourseService } from '@/lib/services'

interface Enrollment {
  id: string
  courseId: string
  lessonsCompleted: number
  totalXPEarned: number
  enrolledAt: string
  completedAt: string | null
}

export default function DashboardPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { connected, publicKey, walletAddress, openWalletModal } = useWallet()
  const rawUserId =
    session?.user?.id ||
    session?.user?.email ||
    walletAddress ||
    null
  const userId =
    typeof rawUserId === 'string' && rawUserId.includes('@')
      ? rawUserId.toLowerCase()
      : rawUserId
  const { stats, loading: statsLoading } = useGamification(undefined, { userId })
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [coursesByKey, setCoursesByKey] = useState<Record<string, CatalogCourse>>({})
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [userProfileXP, setUserProfileXP] = useState<number>(0)
  const xpMint = useMemo(() => {
    const mintStr = process.env.NEXT_PUBLIC_XP_TOKEN_MINT
    if (!mintStr) return undefined
    try {
      return new PublicKey(mintStr)
    } catch {
      return undefined
    }
  }, [])
  const { balance: onChainXp, isLoading: onChainXpLoading } = useXPBalance(publicKey || undefined, xpMint)
  const offChainXp = Math.max(stats?.totalXP ?? 0, userProfileXP)
  const totalXp = connected ? Math.max(offChainXp, onChainXp) : offChainXp
  const level = Math.max(stats?.level || 1, calculateLevel(totalXp), 1)
  const currentLevelXp = level * level * 100
  const nextLevelXp = (level + 1) * (level + 1) * 100
  const xpInCurrentLevel = Math.max(totalXp - currentLevelXp, 0)
  const xpNeededForNextLevel = Math.max(nextLevelXp - currentLevelXp, 100)
  const xpPercentage = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
  )
  
  const completedCoursesCount = Array.isArray(enrollments) ? enrollments.filter((e) => e.completedAt).length : 0
  
  const { unlockedAchievements, newlyUnlocked, dismissNewlyUnlocked } = useAchievements({
    userId: userId || 'guest',
    stats: {
      totalXp,
      totalLessonsCompleted: stats?.lessonsCompleted || 0,
      totalCoursesCompleted: completedCoursesCount,
      currentStreak: stats?.currentStreak || 0,
      lessonsCompletedToday: stats?.lessonsCompletedToday || 0,
    },
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user?.needsProfile) {
      router.replace('/auth/complete-profile')
    }
  }, [status, session, router])

  useEffect(() => {
    let cancelled = false

    async function fetchCourses() {
      try {
        const service = getCourseService()
        const courses = await service.getCourses()
        if (cancelled) return

        const map: Record<string, CatalogCourse> = {}
        for (const course of courses) {
          map[course.id] = course
          map[course.slug] = course
          if (course.onchainCourseId) {
            map[course.onchainCourseId] = course
          }
        }
        setCoursesByKey(map)
      } catch (error) {
        console.warn('Failed to fetch courses for dashboard mapping:', error)
      } finally {
        if (!cancelled) {
          setCoursesLoading(false)
        }
      }
    }

    void fetchCourses()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setEnrollments([])
      setEnrollmentsLoading(false)
      return
    }
    const currentUserId = userId

    let cancelled = false

    async function fetchEnrollments() {
      setEnrollmentsLoading(true)
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(currentUserId)}/enrollments`, {
          cache: 'no-store',
        })
        const data = await response.json()
        if (!cancelled) {
          setEnrollments(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to fetch enrollments:', error)
        if (!cancelled) {
          setEnrollments([])
        }
      } finally {
        if (!cancelled) {
          setEnrollmentsLoading(false)
        }
      }
    }

    void fetchEnrollments()

    return () => {
      cancelled = true
    }
  }, [userId])

  // Fetch user profile XP to stay in sync with profile page
  useEffect(() => {
    if (!userId) {
      setUserProfileXP(0)
      return
    }
    let cancelled = false

    async function fetchUserProfileXP() {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId!)}/profile`, {
          cache: 'no-store',
        })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && typeof data?.totalXP === 'number') {
          setUserProfileXP(data.totalXP)
        }
      } catch {
        // Silently fail — gamification stats is the primary source
      }
    }

    void fetchUserProfileXP()

    return () => {
      cancelled = true
    }
  }, [userId])

  if (status === 'unauthenticated' && !connected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">{t('dashboard.signInTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('dashboard.signInDesc')}</p>
          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <Button className="w-full">{t('nav.signIn')}</Button>
            </Link>
            <Button variant="secondary" className="w-full" onClick={openWalletModal}>
              {t('common.connectWallet')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'authenticated' && session?.user?.needsProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.redirecting')}</p>
        </div>
      </div>
    )
  }

  if (statsLoading || coursesLoading || enrollmentsLoading || (connected && onChainXpLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    )
  }

  const difficultyColors = {
    beginner: 'text-neon-green',
    intermediate: 'text-neon-yellow',
    advanced: 'text-neon-magenta',
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-inherit py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcomeUser').replace('{name}', session?.user?.name || (walletAddress ? `${walletAddress.slice(0, 6)}...` : 'Learner'))} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.keepLearning')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="p-6 border-l-4 border-neon-cyan">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.stats.xp')}</p>
            <p className="text-4xl font-bold text-neon-cyan">{totalXp}</p>
            <p className="text-xs text-gray-500 mt-2">{t('dashboard.keepGrinding')} 🚀</p>
          </Card>

          <Card className="p-6 border-l-4 border-neon-green">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.stats.level')}</p>
            <p className="text-4xl font-bold text-neon-green">{level}</p>
            <p className="text-xs text-gray-500 mt-2">{t('dashboard.doingGreat')} ⭐</p>
          </Card>

          <Card className="p-6 border-l-4 border-neon-magenta">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.currentStreak')}</p>
            <p className="text-4xl font-bold text-neon-magenta">{stats?.currentStreak || 0}</p>
            <p className="text-xs text-gray-500 mt-2">{t('dashboard.daysInRow')} 🔥</p>
          </Card>

          <Card className="p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('dashboard.achievements')}</p>
            <p className="text-4xl font-bold text-blue-500">{unlockedAchievements.length}</p>
            <p className="text-xs text-gray-500 mt-2">{t('dashboard.badgesEarned')} 🏆</p>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.levelProgress')}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Level {level}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {xpInCurrentLevel} / {xpNeededForNextLevel} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-terminal-surface rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-neon-cyan to-neon-green h-3 rounded-full transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {xpPercentage}{t('dashboard.toNextLevel')}
            </p>
          </div>
        </Card>

        {/* In Progress Courses */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.inProgress')}</h2>
            <Link href="/courses">
              <Button variant="secondary" size="sm">
                {t('dashboard.browseMore')}
              </Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('dashboard.noCourses')}</p>
              <Link href="/courses">
                <Button>{t('dashboard.startLearning')}</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => {
                const course =
                  coursesByKey[enrollment.courseId] ||
                  coursesByKey[String(enrollment.courseId).toLowerCase()] ||
                  null

                const totalLessons = course
                  ? course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
                  : 0
                const lessonProgress = totalLessons
                  ? Math.min(Math.round((enrollment.lessonsCompleted / totalLessons) * 100), 100)
                  : 0
                const xpTarget = Math.max(course?.xpReward || 0, enrollment.totalXPEarned || 0, 100)
                const xpProgress = Math.min(Math.round(((enrollment.totalXPEarned || 0) / xpTarget) * 100), 100)
                const progressPercentage = totalLessons > 0 ? lessonProgress : xpProgress
                const courseTitle = course?.title || enrollment.courseId
                const courseDescription = course?.description || 'Course details unavailable'
                const courseSlug = course?.slug || null
                const difficulty = course?.difficulty || 'beginner'

                return (
                  <Card key={enrollment.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {courseTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {courseDescription}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${difficultyColors[difficulty]} ml-2`}>
                        {difficulty.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t('courseDetail.progress')}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {totalLessons > 0
                            ? `${enrollment.lessonsCompleted} / ${totalLessons} lessons`
                            : `${enrollment.totalXPEarned} XP`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-terminal-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-neon-cyan h-2 rounded-full transition-all"
                          style={{
                            width: `${progressPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                      <div>⏱️ {course?.duration || 0} min</div>
                      <div>📚 {course?.track || 'General'}</div>
                      <div>⭐ {enrollment.totalXPEarned} XP</div>
                    </div>

                    {/* Action Button */}
                    {enrollment.completedAt ? (
                      // Course Completed - Show Certificate
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-neon-green/20 border border-neon-green rounded-lg">
                          <span className="text-lg">🎓</span>
                          <span className="text-sm font-semibold text-neon-green">{t('dashboard.courseCompleted')}</span>
                        </div>
                        <Link href="/certificates" className="block">
                          <Button className="w-full" size="sm" variant="primary">
                            {t('dashboard.viewCertificate')} 📜
                          </Button>
                        </Link>
                      </div>
                    ) : courseSlug ? (
                      // In Progress - Continue Learning
                      <Link href={`/courses/${courseSlug}`} className="block">
                        <Button className="w-full" size="sm">
                          {t('dashboard.continueLearning')} →
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/courses" className="block">
                        <Button className="w-full" size="sm">
                          {t('dashboard.viewCatalog')} →
                        </Button>
                      </Link>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-12">
            <AchievementGrid
              achievements={unlockedAchievements}
              unlockedIds={new Set(unlockedAchievements.map(a => a.id))}
            />
          </div>
        )}

        {/* Streak Info */}
        {stats && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('dashboard.streakInfo')}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-neon-magenta mb-2">{stats.currentStreak}</p>
                <p className="text-gray-600 dark:text-gray-400">{t('dashboard.currentStreak')} 🔥</p>
                <p className="text-xs text-gray-500 mt-2">{t('dashboard.keepItGoing')}</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-neon-green mb-2">{stats.longestStreak}</p>
                <p className="text-gray-600 dark:text-gray-400">{t('dashboard.longestStreak')} ⭐</p>
                <p className="text-xs text-gray-500 mt-2">{t('dashboard.bestRecord')}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievement Notifications */}
        {newlyUnlocked.map((achievement) => (
          <AchievementNotification
            key={achievement.id}
            achievement={achievement}
            onDismiss={dismissNewlyUnlocked}
          />
        ))}
      </div>
    </main>
  )
}
