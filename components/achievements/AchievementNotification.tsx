'use client'

import { useEffect, useState } from 'react'
import { AchievementWithCriteria } from '@/lib/services/achievement.service'
import { useI18n } from '@/lib/hooks/useI18n'

interface AchievementNotificationProps {
  achievement: AchievementWithCriteria
  onDismiss: () => void
}

/**
 * Toast notification for newly unlocked achievements
 */
export function AchievementNotification({
  achievement,
  onDismiss,
}: AchievementNotificationProps) {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-center gap-3 rounded-lg border border-yellow-400/50 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 px-4 py-3 backdrop-blur-sm">
        <div className="text-2xl">{achievement.icon}</div>
        <div>
          <p className="font-semibold text-yellow-300">{t('achievements.unlocked')}</p>
          <p className="text-sm text-yellow-200">{achievement.title}</p>
        </div>
      </div>
    </div>
  )
}
