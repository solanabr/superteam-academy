'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import type { Language } from '@/lib/i18n/translations'
import { Card, CardContent, CardHeader, Button, Input } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useWallet } from '@/lib/hooks/useWallet'
import { useTheme } from '@/lib/hooks/useTheme'
import type { Theme } from '@/lib/types/theme'
import { useRouter } from 'next/navigation'

/** Map store theme values ('light'|'dark'|'system') ↔ dropdown values ('light'|'dark'|'auto') */
function themeToDropdown(t: Theme): 'light' | 'dark' | 'auto' {
  return t === 'system' ? 'auto' : t
}
function dropdownToTheme(v: 'light' | 'dark' | 'auto'): Theme {
  return v === 'auto' ? 'system' : v
}

export default function SettingsPage() {
  const router = useRouter()
  const { t, language, setLanguage } = useI18n()
  const { data: session, status } = useSession()
  const { connected, walletAddress, disconnect: disconnectWallet, wallet } = useWallet()
  const { theme: storeTheme, setTheme: setStoreTheme } = useTheme()

  // Form state
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const userId = session?.user?.id || session?.user?.email || null
  const provider = session?.user?.provider // 'google' | 'github' | undefined

  // Load profile data from DB
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function loadProfile() {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId!)}/profile`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.email) setEmail(data.email)
      } catch {
        // Fallback to session email
      }
    }

    void loadProfile()
    return () => { cancelled = true }
  }, [userId])

  // Fallback: use session email if profile didn't load one
  useEffect(() => {
    if (!email && session?.user?.email) {
      setEmail(session.user.email)
    }
  }, [email, session?.user?.email])

  // Save settings to DB
  const handleSave = useCallback(async () => {
    if (!userId) {
      setSaveMessage({ type: 'error', text: t('settings.mustSignIn') })
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Only send fields the PATCH endpoint supports
          ...(email !== session?.user?.email ? { email } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: t('settings.saveFailed') }))
        throw new Error(data.error || t('settings.saveFailed'))
      }

      setSaveMessage({ type: 'success', text: t('settings.saveSuccess') })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('settings.failedSave'),
      })
    } finally {
      setSaving(false)
    }
  }, [userId, email, session?.user?.email])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  const handleDisconnectWallet = useCallback(async () => {
    try {
      await disconnectWallet()
    } catch (error) {
      console.warn('Failed to disconnect wallet:', error)
    }
  }, [disconnectWallet])

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: '/' })
  }, [])

  const handleThemeChange = useCallback(
    (value: 'light' | 'dark' | 'auto') => {
      setStoreTheme(dropdownToTheme(value))
    },
    [setStoreTheme]
  )

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold text-neon-cyan mb-8">
          {t('settings.title')}
        </h1>

        {/* Save feedback */}
        {saveMessage && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm font-medium ${
              saveMessage.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Account Settings */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">{t('settings.account')}</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('settings.email')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            {/* Connected Wallets */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">{t('settings.connectedWallets')}</label>
              <div className="space-y-2">
                {connected && walletAddress ? (
                  <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white">
                        {wallet?.adapter?.name ?? 'Wallet'}{' '}
                        <span className="text-gray-500 text-xs">
                          ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)})
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={handleDisconnectWallet}
                      className="text-neon-red hover:text-neon-red/70 text-sm"
                    >
                      {t('settings.disconnect')}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">{t('settings.noWallet')}</p>
                )}
              </div>
            </div>

            {/* Linked Accounts — show the real OAuth provider */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">{t('settings.linkedAccounts')}</label>
              <div className="space-y-2">
                {status === 'authenticated' && provider ? (
                  <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white capitalize">{provider} {t('common.account')}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-neon-red hover:text-neon-red/70 text-sm"
                    >
                      {t('settings.signOut')}
                    </button>
                  </div>
                ) : status === 'authenticated' ? (
                  <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white">
                        {session?.user?.email || t('settings.signedIn')}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-neon-red hover:text-neon-red/70 text-sm"
                    >
                      {t('settings.signOut')}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">{t('settings.noLinkedAccounts')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">
              {t('settings.preferences')}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('settings.language')}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-2 bg-terminal-surface border-2 border-terminal-border rounded-lg text-white focus:border-neon-cyan transition-colors"
              >
                <option value="en">English</option>
                <option value="pt-br">Português (Brasil)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('settings.theme')}</label>
              <select
                value={themeToDropdown(storeTheme)}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
                className="w-full px-4 py-2 bg-terminal-surface border-2 border-terminal-border rounded-lg text-white focus:border-neon-cyan transition-colors"
              >
                <option value="light">{t('settings.theme_light')}</option>
                <option value="dark">{t('settings.theme_dark')}</option>
                <option value="auto">{t('settings.theme_auto')}</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300">{t('settings.notifications')}</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">{t('settings.privacy')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300">{t('settings.makePublic')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLeaderboard}
                onChange={(e) => setShowLeaderboard(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300">{t('settings.showXpLeaderboard')}</span>
            </label>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? t('settings.savingBtn') : t('common.save')}
          </Button>
          <Button variant="ghost" onClick={handleCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </main>
  )
}
