'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/types'
import { userService } from '@/services/user.service'
import { learningProgressService } from '@/services/learning-progress.service'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (provider: 'google' | 'github' | 'wallet', data?: any) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  linkWallet: (walletAddress: string) => Promise<void>
  unlinkWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load user from localStorage on mount
    loadUserFromStorage()
  }, [])

  const loadUserFromStorage = async () => {
    try {
      const storedUserId = localStorage.getItem('lms_current_user_id')
      if (storedUserId) {
        const userData = await userService.getUser(storedUserId)
        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (provider: 'google' | 'github' | 'wallet', data?: any) => {
    setLoading(true)
    try {
      let userData: User

      switch (provider) {
        case 'google':
          userData = await userService.createUser({
            email: data.email,
            displayName: data.name,
            avatar: data.image,
            googleId: data.id,
          })
          break
        case 'github':
          userData = await userService.createUser({
            username: data.login,
            displayName: data.name || data.login,
            avatar: data.avatar_url,
            githubId: data.id.toString(),
          })
          break
        case 'wallet':
          // Check if wallet is already linked
          const existingUser = await userService.getUserByWallet(data.walletAddress)
          if (existingUser) {
            userData = existingUser
          } else {
            userData = await userService.createUser({
              wallet: data.walletAddress,
              username: `wallet_${data.walletAddress.slice(0, 8)}`,
              displayName: `Wallet User ${data.walletAddress.slice(0, 8)}`,
            })
          }
          break
        default:
          throw new Error('Invalid provider')
      }

      setUser(userData)
      localStorage.setItem('lms_current_user_id', userData.id)
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('lms_current_user_id')
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user signed in')
    }

    const updatedUser = await userService.updateUser(user.id, updates)
    setUser(updatedUser)
  }

  const linkWallet = async (walletAddress: string) => {
    if (!user) {
      throw new Error('No user signed in')
    }

    await userService.linkWallet(user.id, walletAddress)
    const updatedUser = await userService.getUser(user.id)
    if (updatedUser) {
      setUser(updatedUser)
    }
  }

  const unlinkWallet = async () => {
    if (!user) {
      throw new Error('No user signed in')
    }

    await userService.unlinkWallet(user.id)
    const updatedUser = await userService.getUser(user.id)
    if (updatedUser) {
      setUser(updatedUser)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    updateUser,
    linkWallet,
    unlinkWallet,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Demo sign-in function for development
export const signInAsDemo = async () => {
  const authContext = useAuth()
  await authContext.signIn('github', {
    login: 'demo_user',
    name: 'Demo User',
    avatar_url: '/images/demo-avatar.jpg',
    id: 12345,
  })
}