/**
 * API Client Service
 * Handles all HTTP calls to the backend API
 */

import type {
  AuthResponse,
  UserProfileResponse,
  LessonCompletionResponse,
  UserProgressResponse,
  UserRankResponse,
  GamificationStats,
} from '@/lib/types/shared'
import type { LeaderboardEntry, Achievement } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiError {
  error: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const parsedBody = isJson
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '')

      if (!response.ok) {
        const message =
          (typeof parsedBody === 'object' && parsedBody && 'error' in parsedBody
            ? String((parsedBody as Record<string, unknown>).error)
            : typeof parsedBody === 'string' && parsedBody
              ? parsedBody.slice(0, 160)
              : '') || `Request failed (${response.status})`
        throw new Error(message)
      }

      if (response.status === 204) {
        return {} as T
      }

      if (isJson) {
        return (parsedBody as T) || ({} as T)
      }

      return {} as T
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error)
      throw error
    }
  }

  // ============= Auth =============

  async signup(email: string, password: string, displayName: string) {
    return this.request<AuthResponse>('POST', '/auth/signup', {
      email,
      password,
      displayName,
    })
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('POST', '/auth/login', {
      email,
      password,
    })
  }

  async oauthSignup(
    provider: 'google' | 'github',
    providerId: string,
    data: Record<string, unknown>
  ) {
    return this.request<AuthResponse>('POST', '/auth/oauth-signup', {
      provider,
      providerId,
      ...data,
    })
  }

  // ============= User Profile =============

  async getProfile() {
    return this.request<UserProfileResponse>('GET', '/user/profile')
  }

  async updateProfile(updates: {
    displayName?: string
    bio?: string
    avatarUrl?: string
    walletAddress?: string
  }) {
    return this.request<UserProfileResponse>('PATCH', '/user/profile', updates as Record<string, unknown>)
  }

  async linkOAuth(provider: string, providerId: string) {
    return this.request<{ success: boolean }>('POST', '/user/link-oauth', {
      provider,
      providerId,
    })
  }

  // ============= Gamification =============

  async completeLesson(courseId: string, lessonId: string, xpReward: number) {
    return this.request<LessonCompletionResponse>('POST', `/lessons/${courseId}/${lessonId}/complete`, {
      xpReward,
    })
  }

  async getProgress() {
    return this.request<UserProgressResponse>('GET', '/user/progress')
  }

  async getAchievements() {
    return this.request<Achievement[]>('GET', '/user/achievements')
  }

  // ============= Leaderboard =============

  async getLeaderboard(limit = 50, offset = 0) {
    return this.request<LeaderboardEntry[]>('GET', `/leaderboard?limit=${limit}&offset=${offset}`)
  }

  async getUserRank(userId: string) {
    return this.request<UserRankResponse>('GET', `/user/${userId}/rank`)
  }

  // ============= Health =============

  async health() {
    return this.request<{ status: string }>('GET', '/health')
  }
}

// Singleton instance
export const apiClient = new ApiClient()
