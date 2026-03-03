import { AchievementWithCriteria } from '@/lib/services/achievement.service'
import { cn } from '@/lib/utils/cn'

interface AchievementBadgeProps {
  achievement: AchievementWithCriteria
  isUnlocked: boolean
}

/**
 * Displays a single achievement badge with icon, title, and unlock status
 */
export function AchievementBadge({ achievement, isUnlocked }: AchievementBadgeProps) {
  const rarityColors = {
    common: 'border-gray-400 bg-gray-900/50',
    rare: 'border-blue-400 bg-blue-900/20',
    epic: 'border-purple-400 bg-purple-900/20',
    legendary: 'border-yellow-400 bg-yellow-900/20',
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
        isUnlocked ? rarityColors[achievement.rarity] : 'border-gray-600 bg-gray-900/30',
        !isUnlocked && 'opacity-50'
      )}
      title={achievement.description}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{achievement.title}</p>
        <p className="text-xs text-gray-400">{achievement.description}</p>
      </div>
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm">
          <span className="text-xs font-semibold text-gray-300">Locked</span>
        </div>
      )}
    </div>
  )
}
