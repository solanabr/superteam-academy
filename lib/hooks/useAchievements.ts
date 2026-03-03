import { useCallback, useEffect, useState } from 'react'
import { AchievementWithCriteria, getAchievementServiceInstance } from '@/lib/services/achievement.service'

interface UseAchievementsProps {
  userId: string
  stats: {
    totalXp: number
    totalLessonsCompleted: number
    totalCoursesCompleted: number
    currentStreak: number
    lessonsCompletedToday: number
  }
}

export function useAchievements({ userId, stats }: UseAchievementsProps) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementWithCriteria[]>([])
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementWithCriteria[]>([])
  const achievementService = getAchievementServiceInstance()

  const checkAchievements = useCallback(() => {
    const newly = achievementService.checkAndUnlockAchievements(userId, stats)
    if (newly.length > 0) {
      setNewlyUnlocked(newly)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setNewlyUnlocked([]), 5000)
      return () => clearTimeout(timer)
    }
  }, [userId, stats, achievementService])

  useEffect(() => {
    checkAchievements()
  }, [stats, checkAchievements])

  useEffect(() => {
    setUnlockedAchievements(achievementService.getUnlockedAchievements(userId))
  }, [userId, achievementService])

  return {
    unlockedAchievements,
    newlyUnlocked,
    dismissNewlyUnlocked: () => setNewlyUnlocked([]),
  }
}
