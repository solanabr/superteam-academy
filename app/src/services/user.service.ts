import type { User, UserService, UserPreferences } from '@/types'

/**
 * User service implementation using localStorage
 * In production, this would integrate with NextAuth and a database
 */
class LocalUserService implements UserService {
  private readonly STORAGE_KEY = 'lms_users'
  private readonly WALLET_MAPPING_KEY = 'lms_wallet_mappings'

  async getUser(id: string): Promise<User | null> {
    const users = this.getAllUsers()
    return users[id] || null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = this.getAllUsers()
    const existingUser = users[id]
    
    if (!existingUser) {
      throw new Error('User not found')
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
      id, // Ensure ID doesn't change
    }

    users[id] = updatedUser
    this.saveUsers(users)

    return updatedUser
  }

  async getUserByWallet(wallet: string): Promise<User | null> {
    const mappings = this.getWalletMappings()
    const userId = mappings[wallet]
    
    if (!userId) {
      return null
    }

    return this.getUser(userId)
  }

  async linkWallet(userId: string, wallet: string): Promise<void> {
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if wallet is already linked to another user
    const existingUser = await this.getUserByWallet(wallet)
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Wallet is already linked to another account')
    }

    // Update user
    await this.updateUser(userId, { wallet })

    // Update wallet mapping
    const mappings = this.getWalletMappings()
    mappings[wallet] = userId
    this.saveWalletMappings(mappings)
  }

  async unlinkWallet(userId: string): Promise<void> {
    const user = await this.getUser(userId)
    if (!user || !user.wallet) {
      throw new Error('No wallet linked to this user')
    }

    // Remove from mapping
    const mappings = this.getWalletMappings()
    delete mappings[user.wallet]
    this.saveWalletMappings(mappings)

    // Update user
    await this.updateUser(userId, { wallet: undefined })
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const id = userData.id || this.generateUserId()
    const now = new Date().toISOString()

    const defaultPreferences: UserPreferences = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        achievements: true,
        courseUpdates: true,
      },
      privacy: {
        showProfile: true,
        showProgress: true,
        showAchievements: true,
      },
    }

    const newUser: User = {
      id,
      username: userData.username || `user_${id.slice(0, 8)}`,
      displayName: userData.displayName || userData.username || `User ${id.slice(0, 8)}`,
      email: userData.email,
      avatar: userData.avatar,
      bio: userData.bio,
      wallet: userData.wallet,
      googleId: userData.googleId,
      githubId: userData.githubId,
      xp: 0,
      level: 0,
      streak: 0,
      lastActiveDate: now,
      joinDate: now,
      achievements: 0, // Empty bitmap
      skills: [],
      preferences: { ...defaultPreferences, ...userData.preferences },
    }

    const users = this.getAllUsers()
    users[id] = newUser
    this.saveUsers(users)

    return newUser
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = this.getAllUsers()
    const lowercaseQuery = query.toLowerCase()

    return Object.values(users).filter(user =>
      user.username.toLowerCase().includes(lowercaseQuery) ||
      user.displayName.toLowerCase().includes(lowercaseQuery) ||
      (user.email && user.email.toLowerCase().includes(lowercaseQuery))
    ).slice(0, 20) // Limit results
  }

  async getUserStats(userId: string): Promise<{
    totalCourses: number
    completedCourses: number
    totalXP: number
    currentLevel: number
    streakDays: number
    achievements: number
  } | null> {
    const user = await this.getUser(userId)
    if (!user) return null

    // Calculate achievements count from bitmap
    const achievementCount = this.countSetBits(user.achievements)

    return {
      totalCourses: 0, // Would be calculated from progress data
      completedCourses: 0, // Would be calculated from progress data
      totalXP: user.xp,
      currentLevel: user.level,
      streakDays: user.streak,
      achievements: achievementCount,
    }
  }

  private getAllUsers(): Record<string, User> {
    return this.getStorageData(this.STORAGE_KEY, {})
  }

  private saveUsers(users: Record<string, User>): void {
    this.setStorageData(this.STORAGE_KEY, users)
  }

  private getWalletMappings(): Record<string, string> {
    return this.getStorageData(this.WALLET_MAPPING_KEY, {})
  }

  private saveWalletMappings(mappings: Record<string, string>): void {
    this.setStorageData(this.WALLET_MAPPING_KEY, mappings)
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private countSetBits(bitmap: number): number {
    let count = 0
    while (bitmap) {
      count += bitmap & 1
      bitmap >>= 1
    }
    return count
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
export const userService = new LocalUserService()

// Sample user creation for demo purposes
export const createSampleUser = async (): Promise<User> => {
  const sampleUser = await userService.createUser({
    username: 'demo_user',
    displayName: 'Demo User',
    email: 'demo@superteam.academy',
    bio: 'Learning Solana development with Superteam Academy!',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        achievements: true,
        courseUpdates: true,
      },
      privacy: {
        showProfile: true,
        showProgress: true,
        showAchievements: true,
      },
    },
  })

  return sampleUser
}