'use client'

import { Course } from '@/lib/types'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { useWallet } from '@/lib/hooks/useWallet'
import { useEnrollCourse, useEnrollment } from '@/lib/hooks/useOnchain'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useEnrollmentSync } from '@/lib/hooks/useEnrollmentSync'

interface EnrollmentData {
  lessonsCompleted: number
  totalXPEarned?: number
  completedAt?: string | null
}

interface CourseCardProps {
  course: Course
  isEnrolled?: boolean
  enrollmentData?: EnrollmentData | null
  onEnrollmentSuccess?: () => void
}

export function CourseCard({ course, isEnrolled = false, enrollmentData, onEnrollmentSuccess }: CourseCardProps) {
  const { t } = useI18n()
  const { data: session } = useSession()
  const { connected, publicKey, walletAddress, openWalletModal } = useWallet()
  const { mutateAsync: enrollOnChain, isPending: enrolling } = useEnrollCourse()
  const { syncEnrollment } = useEnrollmentSync()
  const onChainCourseId = course.onchainCourseId || course.slug || course.id
  const { data: onChainEnrollment, refetch: refetchEnrollment } = useEnrollment(
    onChainCourseId,
    publicKey || undefined
  )
  const [optimisticEnrolled, setOptimisticEnrolled] = useState(isEnrolled)
  const [savingEnrollment, setSavingEnrollment] = useState(false)

  useEffect(() => {
    setOptimisticEnrolled(isEnrolled)
  }, [isEnrolled])

  const userId =
    (session?.user?.id as string | undefined) ||
    session?.user?.email ||
    walletAddress ||
    null

  const enrolled = optimisticEnrolled || isEnrolled || !!onChainEnrollment

  // Sync on-chain enrollment to DB when detected but DB doesn't know about it
  useEffect(() => {
    if (onChainEnrollment && !isEnrolled) {
      syncEnrollment(course.id, onChainCourseId).then(() => {
        setOptimisticEnrolled(true)
        onEnrollmentSuccess?.()
      })
    }
  }, [onChainEnrollment, isEnrolled, course.id, onChainCourseId, syncEnrollment, onEnrollmentSuccess])

  // Calculate progress percentage from real enrollment data
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
  const lessonsCompleted = enrollmentData?.lessonsCompleted ?? 0
  const progressPercentage = totalLessons > 0
    ? Math.min(Math.round((lessonsCompleted / totalLessons) * 100), 100)
    : 0
  const isCompleted = !!enrollmentData?.completedAt || progressPercentage === 100

  const difficultyStyles: Record<'beginner' | 'intermediate' | 'advanced', string> = {
    beginner: 'border-superteam-emerald/45 bg-superteam-emerald/10 text-superteam-emerald',
    intermediate: 'border-superteam-yellow/55 bg-superteam-yellow/10 text-superteam-yellow',
    advanced: 'border-superteam-navy/55 bg-superteam-navy/10 text-superteam-navy dark:bg-superteam-navy/35 dark:text-superteam-offwhite',
  }

  const thumbnailStyle = course.thumbnail
    ? {
        backgroundImage: `linear-gradient(130deg, rgba(10, 18, 35, 0.75), rgba(18, 157, 73, 0.28), rgba(35, 58, 117, 0.7)), url(${course.thumbnail})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  const handleEnroll = async () => {
    if (!connected || !publicKey) {
      openWalletModal()
      return
    }

    if (!userId) {
      alert('Unable to resolve user identity')
      return
    }

    if (enrolled) {
      return
    }

    setSavingEnrollment(true)

    try {
      const enrollResponse = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId: course.id }),
      })

      if (!enrollResponse.ok && enrollResponse.status !== 200) {
        throw new Error('Failed to save enrollment status')
      }

      setOptimisticEnrolled(true)
      onEnrollmentSuccess?.()

      try {
        await enrollOnChain({ courseId: onChainCourseId })
        await refetchEnrollment()
        // Sync on-chain enrollment state to DB
        await syncEnrollment(course.id, onChainCourseId)
        console.log('[enroll] ✅ On-chain enrollment succeeded')
      } catch (onchainError) {
        // Keep DB enrollment as source of truth if on-chain enrollment fails.
        const msg = onchainError instanceof Error ? onchainError.message : String(onchainError)
        console.warn('[enroll] ⚠️ On-chain enrollment failed, keeping DB enrollment:', msg)
        // Don't surface to user — DB enrollment is the fallback and already succeeded
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to enroll course'
      alert(message)
    } finally {
      setSavingEnrollment(false)
    }
  }

  return (
    <Card
      hover={false}
      className="group relative flex h-full flex-col overflow-hidden border border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-superteam-emerald/35 dark:bg-[#0c152a]/95 dark:shadow-[0_0_0_1px_rgba(18,157,73,0.2),0_16px_40px_-24px_rgba(35,58,117,0.9)] dark:hover:shadow-[0_0_0_1px_rgba(18,157,73,0.35),0_22px_48px_-16px_rgba(35,58,117,0.95)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-superteam-emerald via-superteam-yellow to-superteam-navy" />
      <div className="pointer-events-none absolute -right-14 -top-20 h-36 w-36 rounded-full bg-superteam-yellow/20 blur-3xl dark:bg-superteam-yellow/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-superteam-emerald/20 blur-3xl dark:bg-superteam-emerald/15" />

      {/* Thumbnail */}
      <div
        className="relative mb-4 h-40 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-superteam-offwhite via-white to-superteam-yellow/20 dark:border-superteam-emerald/35 dark:from-[#13223c] dark:via-[#10281f] dark:to-[#233a75]"
        style={thumbnailStyle}
      >
        <div className="absolute left-3 top-3 rounded-full border border-superteam-emerald/35 bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-wide text-superteam-forest backdrop-blur dark:bg-superteam-navy/50 dark:text-superteam-offwhite">
          ON-CHAIN
        </div>
        <div className="absolute right-3 top-3 rounded-full border border-superteam-yellow/40 bg-superteam-yellow/20 px-2 py-1 text-[10px] font-semibold tracking-wide text-superteam-forest backdrop-blur dark:bg-superteam-yellow/15 dark:text-superteam-yellow">
          {course.track}
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.55)]">⛓️</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 font-display text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
          <span className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${difficultyStyles[course.difficulty]}`}>
            {course.difficulty.toUpperCase()}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300/90">{course.description}</p>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-superteam-emerald/35 bg-superteam-offwhite/75 px-3 py-2 text-gray-700 dark:bg-[#0f1f3c] dark:text-gray-200">
            ⏱️ {course.duration} {t('courses.minutes')}
          </div>
          <div className="rounded-md border border-superteam-navy/35 bg-superteam-offwhite/75 px-3 py-2 text-gray-700 dark:bg-[#0f1f3c] dark:text-gray-200">
            👥 {course.enrollmentCount.toLocaleString()}
          </div>
          <div className="rounded-md border border-superteam-yellow/35 bg-superteam-offwhite/75 px-3 py-2 font-semibold text-superteam-forest dark:bg-[#0f1f3c] dark:text-superteam-yellow">
            ⭐ {course.xpReward} XP
          </div>
          <div className="rounded-md border border-superteam-emerald/35 bg-superteam-offwhite/75 px-3 py-2 font-medium text-superteam-navy dark:bg-[#0f1f3c] dark:text-superteam-emerald">
            {course.track}
          </div>
        </div>

        {/* Progress Bar - only shown for enrolled courses */}
        {enrolled && (
          <div className="mb-2 rounded-md border border-superteam-emerald/20 bg-superteam-offwhite/60 p-2 dark:bg-[#0d1a33]/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {isCompleted ? '✅ Completed' : `${lessonsCompleted}/${totalLessons} lessons`}
              </span>
              <span className={`text-xs font-bold ${
                isCompleted
                  ? 'text-superteam-forest dark:text-superteam-emerald'
                  : progressPercentage > 0
                    ? 'text-superteam-navy dark:text-superteam-yellow'
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-gray-300 bg-white/70 dark:border-superteam-navy/60 dark:bg-[#091124]">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isCompleted
                    ? 'bg-gradient-to-r from-superteam-emerald to-superteam-yellow'
                    : progressPercentage > 0
                      ? 'bg-gradient-to-r from-superteam-navy to-superteam-emerald'
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-gray-200/80 pt-4 dark:border-superteam-navy/55">
        <Link href={`/courses/${course.slug}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">
            {t('common.view')}
          </Button>
        </Link>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={handleEnroll}
          disabled={enrolled || enrolling || savingEnrollment}
        >
          {enrolled
            ? t('courses.enrolled')
            : enrolling || savingEnrollment
              ? t('courses.enrolling')
              : connected
                ? t('courses.enroll')
                : t('common.connectWallet')}
        </Button>
      </div>
    </Card>
  )
}
