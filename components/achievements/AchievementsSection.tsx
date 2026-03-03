import { AchievementWithCriteria, getAchievementServiceInstance } from '@/lib/services/achievement.service'
import { AchievementGrid } from '@/components/achievements'

interface AchievementsSectionProps {
  userId: string
}

/**
 * Displays achievements section for profile page
 */
export async function AchievementsSection({ userId }: AchievementsSectionProps) {
  const achievementService = getAchievementServiceInstance()
  const allAchievements = achievementService.getAllAchievements()
  const unlockedAchievements = achievementService.getUnlockedAchievements(userId)
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Achievements</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {unlockedIds.size} of {allAchievements.length} achievements unlocked
        </p>
      </div>

      <AchievementGrid achievements={allAchievements} unlockedIds={unlockedIds} />
    </div>
  )
}
