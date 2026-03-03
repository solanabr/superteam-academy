import { getDatabase } from '../db'
import { randomUUID } from 'crypto'

export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
  totalXP: number
  level: number
  currentStreak: number
  createdAt: Date
}

export class UserService {
  /**
   * Get or create user from OAuth provider
   */
  async getOrCreateUser(provider: string, providerUserId: string, profile: { email?: string; name?: string; login?: string; image?: string; avatar_url?: string }): Promise<User> {
    const db = getDatabase()

    // Use email as user ID
    const email = profile.email || `${provider}-${providerUserId}@academy.local`

    // Check if user exists
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      console.log('User already exists:', email)
      return this.getUserById(email)
    }

    // Create new user with email as ID
    const displayName = profile.name || profile.login || 'User'

    console.log('Creating new user:', email)

    try {
      const { error: insertError } = await db.from('users').insert({
        id: email,
        email,
        display_name: displayName,
        avatar_url: profile.image || profile.avatar_url,
        total_xp: 0,
        level: 1,
        current_streak: 0,
      })

      if (insertError) {
        console.error('User insert error:', insertError)
      } else {
        console.log('User created successfully:', email)
      }

      // Link auth provider
      try {
        await db.from('auth_providers').insert({
          id: randomUUID(),
          user_id: email,
          provider,
          provider_user_id: providerUserId,
        })
      } catch (err) {
        console.log('Auth provider insert skipped')
      }

      // Initialize streak
      try {
        await db.from('streaks').insert({
          id: randomUUID(),
          user_id: email,
          current_streak: 0,
          longest_streak: 0,
        })
      } catch (err) {
        console.log('Streak insert skipped')
      }
    } catch (error) {
      console.error('User creation error:', error)
    }

    return this.getUserById(email)
  }

  /**
   * Get user by ID (email)
   */
  async getUserById(userId: string): Promise<User> {
    const db = getDatabase()

    const { data: user, error } = await db
      .from('users')
      .select('id, email, display_name, avatar_url, total_xp, level, current_streak, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('User fetch error:', error)
    }

    if (!user) {
      console.error('User not found:', userId)
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar_url,
      totalXP: user.total_xp,
      level: user.level,
      currentStreak: user.current_streak,
      createdAt: new Date(user.created_at),
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const db = getDatabase()

    const updates: Record<string, string> = {}
    if (data.displayName) updates.display_name = data.displayName

    if (Object.keys(updates).length > 0) {
      await db.from('users').update(updates).eq('id', userId)
    }

    return this.getUserById(userId)
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string) {
    const db = getDatabase()

    const { data } = await db
      .from('enrollments')
      .select('id, course_id, lessons_completed, total_xp_earned, enrolled_at, completed_at')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    return (data || []).map((e: { id: string; course_id: string; lessons_completed: number; total_xp_earned: number; enrolled_at: string; completed_at: string | null }) => ({
      id: e.id,
      courseId: e.course_id,
      lessonsCompleted: e.lessons_completed,
      totalXPEarned: e.total_xp_earned,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
    }))
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100) {
    const db = getDatabase()

    const { data } = await db
      .from('users')
      .select('id, display_name, avatar_url, total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(limit)

    return (data || []).map((u: { id: string; display_name: string; avatar_url: string | null; total_xp: number; level: number }) => ({
      id: u.id,
      displayName: u.display_name,
      avatar: u.avatar_url,
      totalXP: u.total_xp,
      level: u.level,
    }))
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: string): Promise<number> {
    const db = getDatabase()

    const { data: user } = await db
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .maybeSingle()

    if (!user) throw new Error('User not found')

    const { count } = await db
      .from('users')
      .select('id', { count: 'exact' })
      .gt('total_xp', user.total_xp)

    return (count || 0) + 1
  }
}

export const userService = new UserService()
