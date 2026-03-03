import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api/api-client'

interface User {
  id: string
  email?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  walletAddress?: string
  totalXP?: number
  level?: number
  currentStreak?: number
  longestStreak?: number
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          apiClient.setToken(token)
          const profile = await apiClient.getProfile()
          setUser(profile)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const { user: userData, token } = await apiClient.login(email, password)
      apiClient.setToken(token)
      setUser(userData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    }
  }

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null)
      const { user: userData, token } = await apiClient.signup(email, password, displayName)
      apiClient.setToken(token)
      setUser(userData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(message)
      throw err
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setUser(null)
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null)
      const updated = await apiClient.updateProfile(updates)
      setUser(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      setError(message)
      throw err
    }
  }

  const refreshUser = async () => {
    try {
      const profile = await apiClient.getProfile()
      setUser(profile)
    } catch (err) {
      console.error('Refresh error:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
