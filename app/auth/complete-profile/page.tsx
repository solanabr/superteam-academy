'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/hooks/useI18n'

export default function CompleteProfile() {
  const { t } = useI18n()
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [checkingUser, setCheckingUser] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
  })
  const [error, setError] = useState('')
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (session?.user) {
      const user = session.user
      if (user.name) {
        setFormData(prev => ({ ...prev, displayName: user.name || '' }))
      }
      if (user.email) {
        checkUserExists(user.email)
      } else {
        setUserExists(false)
        setIsSignUp(true)
        setCheckingUser(false)
      }
    }
  }, [session, status, router])

  useEffect(() => {
    if (userExists) {
      router.replace('/dashboard')
    }
  }, [userExists, router])

  const checkUserExists = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email.toLowerCase())
      const response = await fetch(`${apiBaseUrl}/users/${encodedEmail}/profile`)
      if (response.ok) {
        setUserExists(true)
        setIsSignUp(false)
      } else {
        setUserExists(false)
        setIsSignUp(true)
      }
    } catch (err) {
      setUserExists(false)
      setIsSignUp(true)
    } finally {
      setCheckingUser(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.displayName || !formData.age) {
        setError(t('auth.allFieldsRequired'))
        setLoading(false)
        return
      }

      const userId = session?.user?.id || session?.user?.email

      // Create/update user profile in backend
      const response = await fetch(`${apiBaseUrl}/users/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: session?.user?.provider || 'google',
          providerUserId: userId,
          profile: {
            email: session?.user?.email,
            name: formData.displayName,
            age: parseInt(formData.age),
            image: session?.user?.image,
          },
        }),
      })

      if (response.ok) {
        await update({ needsProfile: false })
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || t('auth.failedSaveProfile'))
      }
    } catch (err) {
      setError(t('auth.errorTryAgain'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || checkingUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (userExists) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-neon-cyan mb-2">{t('auth.redirectingDashboard')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('auth.takingToDashboard')}</p>
          </div>
        </div>
      </div>
    )
  }

  // New user - show signup form
  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">{t('auth.completeProfile')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('auth.welcomeAcademy')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth.displayName')}
            </label>
            <input
              type="text"
              name="displayName"
              placeholder={t('auth.displayNamePlaceholder')}
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-terminal-surface border-2 border-gray-300 dark:border-terminal-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-600 dark:focus:border-neon-cyan transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.age')}
            </label>
            <input
              type="number"
              name="age"
              placeholder={t('auth.agePlaceholder')}
              value={formData.age}
              onChange={handleChange}
              min="13"
              max="120"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-terminal-surface border-2 border-gray-300 dark:border-terminal-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-600 dark:focus:border-neon-cyan transition-colors"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-neon-cyan text-terminal-bg font-semibold rounded-lg hover:bg-neon-cyan/90 transition-colors disabled:opacity-50"
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAndContinue')}
            </button>
          </div>
        </form>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {t('auth.signOutBtn')}
        </button>

        <div className="p-4 bg-gray-100 dark:bg-terminal-surface rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Email: {session?.user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}
