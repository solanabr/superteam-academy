import { getDatabase } from '../db'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

export interface SignupParams {
  email: string
  password: string
  firstName: string
  lastName: string
  age?: number
  bio?: string
  avatar?: string
}

export interface LoginParams {
  email: string
  password: string
}

export interface AuthResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  age?: number
  bio?: string
  avatar?: string
  token: string
  createdAt: Date
}

export class AuthService {
  /**
   * Sign up new user with full profile
   */
  async signup(params: SignupParams): Promise<AuthResponse> {
    const supabase = getDatabase()

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .single()

    if (existing) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(params.password, 10)

    // Create user with full profile
    const userId = randomUUID()
    const displayName = `${params.firstName} ${params.lastName}`

    const { error } = await supabase.from('users').insert({
      id: userId,
      email: params.email,
      display_name: displayName,
      password_hash: passwordHash,
      bio: params.bio || null,
      avatar_url: params.avatar || null,
      total_xp: 0,
      level: 1,
      current_streak: 0,
    })

    if (error) throw new Error(error.message)

    // Store additional profile data in a separate table if needed
    await supabase.from('user_profiles').insert({
      id: randomUUID(),
      user_id: userId,
      first_name: params.firstName,
      last_name: params.lastName,
      age: params.age || null,
      created_at: new Date().toISOString(),
    }).catch(() => {}) // Ignore if table doesn't exist yet

    // Generate token
    const token = jwt.sign(
      { userId, email: params.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return {
      id: userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      displayName,
      age: params.age,
      bio: params.bio,
      avatar: params.avatar,
      token,
      createdAt: new Date(),
    }
  }

  /**
   * Login user
   */
  async login(params: LoginParams): Promise<AuthResponse> {
    const supabase = getDatabase()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, display_name, password_hash, bio, avatar_url, created_at')
      .eq('email', params.email)
      .single()

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await bcrypt.compare(params.password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Get profile details
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', user.id)
      .single()
      .catch(() => ({ data: null }))

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    const [firstName, lastName] = user.display_name.split(' ')

    return {
      id: user.id,
      email: user.email,
      firstName: profile?.first_name || firstName || 'User',
      lastName: profile?.last_name || lastName || '',
      displayName: user.display_name,
      age: profile?.age,
      bio: user.bio,
      avatar: user.avatar_url,
      token,
      createdAt: new Date(user.created_at),
    }
  }

  /**
   * Verify token
   */
  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; email: string }
      return { userId: decoded.userId, email: decoded.email }
    } catch {
      return null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<SignupParams>): Promise<AuthResponse> {
    const supabase = getDatabase()

    const updateData: Record<string, string> = {}
    if (updates.bio) updateData.bio = updates.bio
    if (updates.avatar) updateData.avatar_url = updates.avatar
    if (updates.firstName || updates.lastName) {
      updateData.display_name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim()
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from('users').update(updateData).eq('id', userId)
    }

    // Update profile table
    if (updates.firstName || updates.lastName || updates.age) {
      const profileUpdate: Record<string, string | number> = {}
      if (updates.firstName) profileUpdate.first_name = updates.firstName
      if (updates.lastName) profileUpdate.last_name = updates.lastName
      if (updates.age) profileUpdate.age = updates.age

      await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('user_id', userId)
        .catch(() => {})
    }

    // Fetch updated user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, display_name, bio, avatar_url, created_at')
      .eq('id', userId)
      .single()

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', userId)
      .single()
      .catch(() => ({ data: null }))

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return {
      id: user.id,
      email: user.email,
      firstName: profile?.first_name || 'User',
      lastName: profile?.last_name || '',
      displayName: user.display_name,
      age: profile?.age,
      bio: user.bio,
      avatar: user.avatar_url,
      token,
      createdAt: new Date(user.created_at),
    }
  }
}

export const authService = new AuthService()
