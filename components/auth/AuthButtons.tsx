'use client'

import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useI18n } from '@/lib/hooks/useI18n'

export function AuthButtons() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (status === 'loading') {
    return (
      <button
        disabled
        className="px-3 py-1 bg-gray-200 dark:bg-terminal-surface text-gray-500 dark:text-gray-400 rounded text-sm font-semibold cursor-not-allowed"
      >
        {t('common.loading')}
      </button>
    )
  }

  if (session?.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold text-blue-600 dark:text-neon-cyan hover:bg-gray-100 dark:hover:bg-terminal-surface/80 transition-colors"
        >
          <img
            src={session.user.image || '/default-avatar.png'}
            alt={session.user.name || 'User'}
            className="w-6 h-6 rounded-full"
          />
          <span className="hidden sm:inline">{session.user.name?.split(' ')[0]}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded shadow-lg z-50">
            <Link
              href="/profile"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-terminal-surface/80 text-sm"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.profile')}
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-terminal-surface/80 text-sm"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.settings')}
            </Link>
            <button
              onClick={() => {
                signOut()
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-terminal-surface/80 text-sm border-t border-gray-300 dark:border-terminal-border"
            >
              {t('nav.signOut')}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push('/auth/signin')}
      className="px-3 py-1 bg-blue-600 dark:bg-neon-cyan hover:bg-blue-700 dark:hover:bg-neon-cyan/90 text-white dark:text-terminal-bg rounded text-sm font-semibold transition-colors"
    >
      {t('nav.signIn')}
    </button>
  )
}
