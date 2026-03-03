'use client'

import { AchievementWithCriteria } from '@/lib/services/achievement.service'
import { AchievementBadge } from './AchievementBadge'
import { useI18n } from '@/lib/hooks/useI18n'

interface AchievementGridProps {
  achievements: AchievementWithCriteria[]
  unlockedIds: Set<string>
}

/**
 * Displays a grid of achievement badges
 */
export function AchievementGrid({ achievements, unlockedIds }: AchievementGridProps) {
  const { t } = useI18n()
  const unlockedCount = unlockedIds.size
  const totalCount = achievements.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t('achievements.title')}</h3>
        <span className="text-sm text-gray-400">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            isUnlocked={unlockedIds.has(achievement.id)}
          />
        ))}
      </div>
    </div>
  )
}
