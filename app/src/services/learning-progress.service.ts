import { PublicKey } from '@solana/web3.js'
import type {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  ActivityFeedItem,
  AchievementContext,
  Achievement,
} from '@/types'

/**
 * Local storage implementation of LearningProgressService
 * This interface allows easy swapping to on-chain implementation later
 */
class LocalLearningProgressService implements LearningProgressService {
  private readonly STORAGE_KEYS = {
    PROGRESS: 'lms_progress',
    XP: 'lms_xp',
    STREAKS: 'lms_streaks',
    LEADERBOARD: 'lms_leaderboard',
    CREDENTIALS: 'lms_credentials',
    ACTIVITY_FEED: 'lms_activity_feed',
    ACHIEVEMENTS: 'lms_achievements',
    USER_ACHIEVEMENTS: 'lms_user_achievements',
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const allProgress = this.getAllProgress()
    const key = `${userId}:${courseId}`
    
    return allProgress[key] || {
      userId,
      courseId,
      completedLessons: [],
      completedChallenges: [],
      score: 0,
      xpEarned: 0,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      timeSpent: 0,
    }
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const progress = await this.getProgress(userId, courseId)
    const lessonId = `${courseId}:lesson:${lessonIndex}`
    
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId)
      progress.lastAccessedAt = new Date().toISOString()
      
      // Award XP (10-50 points per lesson)
      const xpGained = 25 + Math.floor(Math.random() * 25) // 25-50 XP
      progress.xpEarned += xpGained
      
      // Update total user XP
      const currentXP = await this.getXP(userId)
      await this.setXP(userId, currentXP + xpGained)
      
      // Update streak
      await this.updateStreak(userId)
      
      // Check for achievements
      await this.checkAchievements(userId, {
        type: 'lesson_completed',
        data: { courseId, lessonId, xpGained }
      })
      
      // Save progress
      await this.updateProgress(progress)
      
      // Add to activity feed
      await this.addActivityFeedItem({
        id: `${Date.now()}:lesson_completed`,
        userId,
        type: 'lesson_completed',
        title: 'Lesson Completed!',
        description: `Earned ${xpGained} XP`,
        timestamp: new Date().toISOString(),
        metadata: { courseId, lessonId, xpGained }
      })
    }
  }

  async getXP(userId: string): Promise<number> {
    const allXP = this.getStorageData(this.STORAGE_KEYS.XP, {})
    return allXP[userId] || 0
  }

  private async setXP(userId: string, xp: number): Promise<void> {
    const allXP = this.getStorageData(this.STORAGE_KEYS.XP, {})
    allXP[userId] = xp
    this.setStorageData(this.STORAGE_KEYS.XP, allXP)
    
    // Update leaderboard
    await this.updateLeaderboard(userId, xp)
  }

  async getStreak(userId: string): Promise<StreakData> {
    const allStreaks = this.getStorageData(this.STORAGE_KEYS.STREAKS, {})
    const today = new Date().toISOString().split('T')[0]
    
    return allStreaks[userId] || {
      current: 0,
      longest: 0,
      lastActiveDate: today,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      monthlyActivity: {}
    }
  }

  private async updateStreak(userId: string): Promise<void> {
    const streakData = await this.getStreak(userId)
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Update daily activity
    const dayOfWeek = today.getDay()
    streakData.weeklyActivity[dayOfWeek] += 1
    streakData.monthlyActivity[todayString] = (streakData.monthlyActivity[todayString] || 0) + 1
    
    // Update streak
    if (streakData.lastActiveDate === yesterday) {
      streakData.current += 1
    } else if (streakData.lastActiveDate !== todayString) {
      streakData.current = 1
    }
    
    streakData.longest = Math.max(streakData.longest, streakData.current)
    streakData.lastActiveDate = todayString
    
    // Save updated streak
    const allStreaks = this.getStorageData(this.STORAGE_KEYS.STREAKS, {})
    allStreaks[userId] = streakData
    this.setStorageData(this.STORAGE_KEYS.STREAKS, allStreaks)
    
    // Check for streak achievements
    if (streakData.current % 7 === 0 && streakData.current > 0) {
      await this.checkAchievements(userId, {
        type: 'streak_milestone',
        data: { streakCount: streakData.current }
      })
    }
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> {
    const leaderboard = this.getStorageData(this.STORAGE_KEYS.LEADERBOARD, [])
    
    // Sort by appropriate XP field
    const sortKey = timeframe === 'weekly' ? 'weeklyXP' : 
                   timeframe === 'monthly' ? 'monthlyXP' : 'xp'
    
    return leaderboard
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => (b[sortKey] || 0) - (a[sortKey] || 0))
      .map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: index + 1
      }))
      .slice(0, 100) // Top 100
  }

  private async updateLeaderboard(userId: string, totalXP: number): Promise<void> {
    const leaderboard = this.getStorageData(this.STORAGE_KEYS.LEADERBOARD, [])
    const existingIndex = leaderboard.findIndex((entry: LeaderboardEntry) => entry.userId === userId)
    
    const level = Math.floor(Math.sqrt(totalXP / 100))
    
    const entry: LeaderboardEntry = {
      userId,
      username: `user_${userId.slice(0, 8)}`,
      displayName: `User ${userId.slice(0, 8)}`,
      xp: totalXP,
      level,
      rank: 0, // Will be calculated in getLeaderboard
      weeklyXP: this.calculateWeeklyXP(userId),
      monthlyXP: this.calculateMonthlyXP(userId)
    }
    
    if (existingIndex >= 0) {
      leaderboard[existingIndex] = entry
    } else {
      leaderboard.push(entry)
    }
    
    this.setStorageData(this.STORAGE_KEYS.LEADERBOARD, leaderboard)
  }

  private calculateWeeklyXP(userId: string): number {
    // Simplified calculation - would be more complex in real implementation
    return Math.floor(Math.random() * 500)
  }

  private calculateMonthlyXP(userId: string): number {
    // Simplified calculation - would be more complex in real implementation
    return Math.floor(Math.random() * 2000)
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    const walletString = wallet.toString()
    const allCredentials = this.getStorageData(this.STORAGE_KEYS.CREDENTIALS, {})
    return allCredentials[walletString] || []
  }

  async getUserProgress(userId: string): Promise<Progress[]> {
    const allProgress = this.getAllProgress()
    return Object.values(allProgress).filter((progress: Progress) => progress.userId === userId)
  }

  async updateProgress(progress: Partial<Progress>): Promise<void> {
    if (!progress.userId || !progress.courseId) {
      throw new Error('userId and courseId are required')
    }
    
    const allProgress = this.getAllProgress()
    const key = `${progress.userId}:${progress.courseId}`
    const existing = allProgress[key] || {}
    
    allProgress[key] = { ...existing, ...progress }
    this.setStorageData(this.STORAGE_KEYS.PROGRESS, allProgress)
  }

  private getAllProgress(): Record<string, Progress> {
    return this.getStorageData(this.STORAGE_KEYS.PROGRESS, {})
  }

  private async addActivityFeedItem(item: ActivityFeedItem): Promise<void> {
    const feed = this.getStorageData(this.STORAGE_KEYS.ACTIVITY_FEED, [])
    feed.unshift(item) // Add to beginning
    
    // Keep only last 100 items
    if (feed.length > 100) {
      feed.splice(100)
    }
    
    this.setStorageData(this.STORAGE_KEYS.ACTIVITY_FEED, feed)
  }

  private async checkAchievements(userId: string, context: AchievementContext): Promise<void> {
    const userAchievements = this.getUserAchievementsBitmap(userId)
    const allAchievements = this.getAllAchievements()
    
    for (const achievement of allAchievements) {
      // Check if already unlocked
      if (this.hasAchievement(userAchievements, achievement.id)) continue
      
      // Check if requirements met (simplified logic)
      let requirementMet = false
      
      switch (achievement.id) {
        case 0: // First Steps
          requirementMet = context.type === 'lesson_completed'
          break
        case 1: // Week Warrior
          requirementMet = context.type === 'streak_milestone' && (context.data.streakCount || 0) >= 7
          break
        case 2: // Challenge Master
          requirementMet = context.type === 'challenge_solved'
          break
        // Add more achievement logic as needed
      }
      
      if (requirementMet) {
        await this.unlockAchievement(userId, achievement)
      }
    }
  }

  private getUserAchievementsBitmap(userId: string): number {
    const allUserAchievements = this.getStorageData(this.STORAGE_KEYS.USER_ACHIEVEMENTS, {})
    return allUserAchievements[userId] || 0
  }

  private hasAchievement(bitmap: number, achievementId: number): boolean {
    return (bitmap & (1 << achievementId)) !== 0
  }

  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    // Update bitmap
    const bitmap = this.getUserAchievementsBitmap(userId)
    const newBitmap = bitmap | (1 << achievement.id)
    
    const allUserAchievements = this.getStorageData(this.STORAGE_KEYS.USER_ACHIEVEMENTS, {})
    allUserAchievements[userId] = newBitmap
    this.setStorageData(this.STORAGE_KEYS.USER_ACHIEVEMENTS, allUserAchievements)
    
    // Award XP
    const currentXP = await this.getXP(userId)
    await this.setXP(userId, currentXP + achievement.xpReward)
    
    // Add to activity feed
    await this.addActivityFeedItem({
      id: `${Date.now()}:achievement`,
      userId,
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked!',
      description: achievement.name,
      timestamp: new Date().toISOString(),
      metadata: { achievementId: achievement.id, xpGained: achievement.xpReward }
    })
  }

  private getAllAchievements(): Achievement[] {
    return this.getStorageData(this.STORAGE_KEYS.ACHIEVEMENTS, this.getDefaultAchievements())
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 0,
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '👶',
        category: 'progress',
        requirement: 'Complete any lesson',
        xpReward: 25
      },
      {
        id: 1,
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streaks',
        requirement: '7 consecutive days of activity',
        xpReward: 100
      },
      {
        id: 2,
        name: 'Code Crusher',
        description: 'Solve your first coding challenge',
        icon: '⚡',
        category: 'skills',
        requirement: 'Complete any coding challenge',
        xpReward: 50
      },
      // Add more achievements as needed
    ]
  }

  private getStorageData(key: string, defaultValue: any): any {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch {
      return defaultValue
    }
  }

  private setStorageData(key: string, data: any): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
}

// Export singleton instance
export const learningProgressService = new LocalLearningProgressService()