import { getDatabase } from '../db'
import { randomUUID } from 'crypto'

export class GamificationService {
  /**
   * Award XP for lesson completion
   */
  static async awardXP(userId: string, amount: number, reason: string): Promise<number> {
    const supabase = getDatabase()

    // Award XP
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .update({ total_xp: (user?.total_xp || 0) + amount })
      .eq('id', userId)

    // Log transaction
    await supabase.from('xp_transactions').insert({
      id: randomUUID(),
      user_id: userId,
      amount,
      reason,
    })

    return (user?.total_xp || 0) + amount
  }

  /**
   * Calculate level from XP
   * Formula: Level = floor(sqrt(totalXP / 100))
   * e.g. 0 XP = Level 0, 100 XP = Level 1, 400 XP = Level 2, 900 XP = Level 3
   */
  static calculateLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100))
  }

  /**
   * Get XP needed for next level
   * Next level threshold = (currentLevel + 1)^2 * 100
   */
  static getXPForNextLevel(currentLevel: number): number {
    return (currentLevel + 1) * (currentLevel + 1) * 100
  }

  /**
   * Update user level based on XP
   */
  static async updateLevel(userId: string): Promise<number> {
    const supabase = getDatabase()

    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()

    const newLevel = this.calculateLevel(user?.total_xp || 0)

    await supabase.from('users').update({ level: newLevel }).eq('id', userId)

    return newLevel
  }

  /**
   * Update streak
   */
  static async updateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const supabase = getDatabase()

    const today = new Date().toISOString().split('T')[0]

    // Check if user has activity today
    const { data: todayActivity } = await supabase
      .from('streak_history')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single()

    if (todayActivity) {
      // Already has activity today
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single()

      return { current: streak?.current_streak || 0, longest: streak?.longest_streak || 0 }
    }

    // Add today's activity
    await supabase.from('streak_history').insert({
      id: randomUUID(),
      user_id: userId,
      activity_date: today,
      xp_earned: 0,
    })

    // Check if yesterday had activity
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: yesterdayActivity } = await supabase
      .from('streak_history')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_date', yesterday)
      .single()

    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single()

    let newStreak = 1
    if (yesterdayActivity) {
      newStreak = (streak?.current_streak || 0) + 1
    }

    const newLongest = Math.max(newStreak, streak?.longest_streak || 0)

    await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
      })
      .eq('user_id', userId)

    await supabase.from('users').update({ current_streak: newStreak }).eq('id', userId)

    return { current: newStreak, longest: newLongest }
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(userId: string): Promise<string[]> {
    const supabase = getDatabase()

    const { data: user } = await supabase
      .from('users')
      .select('total_xp, level')
      .eq('id', userId)
      .single()

    const unlockedAchievements: string[] = []

    // XP-based achievements
    const xpAchievements = [
      { id: 'xp_100', xp: 100, name: 'First Steps' },
      { id: 'xp_500', xp: 500, name: 'Getting Started' },
      { id: 'xp_1000', xp: 1000, name: 'Momentum' },
      { id: 'xp_5000', xp: 5000, name: 'Expert' },
      { id: 'xp_10000', xp: 10000, name: 'Master' },
    ]

    for (const achievement of xpAchievements) {
      if ((user?.total_xp || 0) >= achievement.xp) {
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single()

        if (!existing) {
          await supabase.from('user_achievements').insert({
            id: randomUUID(),
            user_id: userId,
            achievement_id: achievement.id,
          })
          unlockedAchievements.push(achievement.name)
        }
      }
    }

    return unlockedAchievements
  }

  /**
   * Get user gamification stats
   */
  static async getStats(userId: string) {
    const supabase = getDatabase()

    const { data: user } = await supabase
      .from('users')
      .select('total_xp, level, current_streak')
      .eq('id', userId)
      .single()

    const { data: streak } = await supabase
      .from('streaks')
      .select('longest_streak')
      .eq('user_id', userId)
      .single()

    const { count: achievementCount } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const nextLevelXP = this.getXPForNextLevel(user?.level || 1)
    const currentLevelXP = ((user?.level || 1) - 1) * ((user?.level || 1) - 1) * 100

    return {
      totalXP: user?.total_xp || 0,
      level: user?.level || 1,
      currentStreak: user?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      achievementsUnlocked: achievementCount || 0,
      xpProgress: {
        current: (user?.total_xp || 0) - currentLevelXP,
        needed: nextLevelXP - currentLevelXP,
        percentage: Math.round((((user?.total_xp || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100),
      },
    }
  }
}
