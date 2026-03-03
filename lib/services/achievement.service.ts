import { Achievement } from '../types'
import type { IAchievementService } from '@/lib/types/service-interfaces'

export interface AchievementCriteria {
  type: 'lesson_complete' | 'course_complete' | 'xp_threshold' | 'streak' | 'lessons_in_day'
  value: number | string
}

export interface AchievementWithCriteria extends Achievement {
  criteria: AchievementCriteria
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const ACHIEVEMENTS: AchievementWithCriteria[] = [
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '👣',
    category: 'progress',
    criteria: { type: 'lesson_complete', value: 1 },
    rarity: 'common',
  },
  {
    id: 'course-complete',
    title: 'Course Master',
    description: 'Complete your first course',
    icon: '🎓',
    category: 'progress',
    criteria: { type: 'course_complete', value: 1 },
    rarity: 'rare',
  },
  {
    id: 'three-courses',
    title: 'Triple Threat',
    description: 'Complete 3 courses',
    icon: '🔥',
    category: 'progress',
    criteria: { type: 'course_complete', value: 3 },
    rarity: 'epic',
  },
  {
    id: 'xp-100',
    title: 'XP Collector',
    description: 'Earn 100 XP',
    icon: '⭐',
    category: 'progress',
    criteria: { type: 'xp_threshold', value: 100 },
    rarity: 'common',
  },
  {
    id: 'xp-500',
    title: 'XP Master',
    description: 'Earn 500 XP',
    icon: '✨',
    category: 'progress',
    criteria: { type: 'xp_threshold', value: 500 },
    rarity: 'rare',
  },
  {
    id: 'xp-1000',
    title: 'XP Legend',
    description: 'Earn 1000 XP',
    icon: '👑',
    category: 'progress',
    criteria: { type: 'xp_threshold', value: 1000 },
    rarity: 'legendary',
  },
  {
    id: 'streak-3',
    title: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak', value: 3 },
    rarity: 'rare',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚔️',
    category: 'streak',
    criteria: { type: 'streak', value: 7 },
    rarity: 'epic',
  },
  {
    id: 'five-lessons-day',
    title: 'Speed Learner',
    description: 'Complete 5 lessons in one day',
    icon: '⚡',
    category: 'progress',
    criteria: { type: 'lessons_in_day', value: 5 },
    rarity: 'rare',
  },
]

export interface UserAchievements {
  userId: string
  unlockedIds: Set<string>
  unlockedAt: Map<string, Date>
}

export class AchievementService implements IAchievementService {
  private userAchievements = new Map<string, UserAchievements>()

  getAllAchievements(): AchievementWithCriteria[] {
    return ACHIEVEMENTS
  }

  getUserAchievements(userId: string): AchievementWithCriteria[] {
    const unlocked = this.userAchievements.get(userId)?.unlockedIds || new Set()
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlockedAt: this.userAchievements.get(userId)?.unlockedAt.get(achievement.id),
    }))
  }

  getUnlockedAchievements(userId: string): AchievementWithCriteria[] {
    const unlocked = this.userAchievements.get(userId)?.unlockedIds || new Set()
    return ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).map((achievement) => ({
      ...achievement,
      unlockedAt: this.userAchievements.get(userId)?.unlockedAt.get(achievement.id),
    }))
  }

  checkAndUnlockAchievements(
    userId: string,
    stats: {
      totalXp: number
      totalLessonsCompleted: number
      totalCoursesCompleted: number
      currentStreak: number
      lessonsCompletedToday: number
    }
  ): AchievementWithCriteria[] {
    if (!this.userAchievements.has(userId)) {
      this.userAchievements.set(userId, {
        userId,
        unlockedIds: new Set(),
        unlockedAt: new Map(),
      })
    }

    const userAchievements = this.userAchievements.get(userId)!
    const newlyUnlocked: AchievementWithCriteria[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (userAchievements.unlockedIds.has(achievement.id)) {
        continue // Already unlocked
      }

      const isUnlocked = this.checkCriteria(achievement.criteria, stats)

      if (isUnlocked) {
        userAchievements.unlockedIds.add(achievement.id)
        userAchievements.unlockedAt.set(achievement.id, new Date())
        newlyUnlocked.push({
          ...achievement,
          unlockedAt: new Date(),
        })
      }
    }

    return newlyUnlocked
  }

  private checkCriteria(
    criteria: AchievementCriteria,
    stats: {
      totalXp: number
      totalLessonsCompleted: number
      totalCoursesCompleted: number
      currentStreak: number
      lessonsCompletedToday: number
    }
  ): boolean {
    switch (criteria.type) {
      case 'lesson_complete':
        return stats.totalLessonsCompleted >= (criteria.value as number)
      case 'course_complete':
        return stats.totalCoursesCompleted >= (criteria.value as number)
      case 'xp_threshold':
        return stats.totalXp >= (criteria.value as number)
      case 'streak':
        return stats.currentStreak >= (criteria.value as number)
      case 'lessons_in_day':
        return stats.lessonsCompletedToday >= (criteria.value as number)
      default:
        return false
    }
  }

  resetUserAchievements(userId: string): void {
    this.userAchievements.delete(userId)
  }
}

let achievementServiceInstance: AchievementService | null = null

export function getAchievementServiceInstance(): AchievementService {
  if (!achievementServiceInstance) {
    achievementServiceInstance = new AchievementService()
  }
  return achievementServiceInstance
}
