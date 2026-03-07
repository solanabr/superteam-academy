'use client'

import { User } from '@/libs/auth'
import { signIn, useSession } from '@/libs/auth-client'
import { truncateAddress } from '@/libs/string'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import bs58 from 'bs58'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronRight,
  Github,
  Linkedin,
  Loader2,
  Send,
  Wallet,
  Zap,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useCallback, useEffect, useState } from 'react'
import { awardSignupXP } from '../../actions'

// ─── Types ──────────────────────────────────────────────────────

type AuthMethod = 'wallet' | 'google' | 'github' | null
type Step = 'auth' | 'onboarding' | 'success'

// ─── Step Dots ──────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className='flex items-center justify-center gap-1.5 mb-6'>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className='rounded-full transition-all duration-300'
          style={{
            width: i === current ? '20px' : '6px',
            height: '6px',
            background:
              i <= current
                ? 'hsl(var(--green-primary))'
                : 'hsl(var(--cream) / 0.25)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Social Input ────────────────────────────────────────────────

function SocialInput({
  icon,
  prefix,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  prefix: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className='flex items-center rounded-xl border overflow-hidden focus-within:border-green-primary/50 transition-colors'
      style={{
        background: 'hsl(var(--green-hero) / 0.5)',
        borderColor: 'hsl(var(--cream) / 0.12)',
      }}
    >
      <div
        className='px-3 py-2.5 flex items-center gap-1.5 border-r'
        style={{ borderColor: 'hsl(var(--cream) / 0.1)' }}
      >
        <span className='text-cream/40'>{icon}</span>
        <span className='font-ui text-[0.65rem] text-cream/35 whitespace-nowrap'>
          {prefix}
        </span>
      </div>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='flex-1 px-3 py-2.5 bg-transparent font-ui text-[0.8rem] text-cream focus:outline-none placeholder:text-cream/25'
      />
    </div>
  )
}

// ─── Step 0: Auth Method Selection ──────────────────────────────

function AuthStep({
  onSelect,
  onWalletAuth,
}: {
  onSelect: (method: AuthMethod) => void
  onWalletAuth: () => void
}) {
  const t = useTranslations('login')
  const locale = useLocale()
  const [loading, setLoading] = useState<AuthMethod>(null)
  const [error, setError] = useState<string | null>(null)
  const { connected, publicKey, signMessage, disconnect } = useWallet()
  const { setVisible } = useWalletModal()

  // Wallet connect flow: detect connection → sign message → verify via plugin
  useEffect(() => {
    if (!connected || !publicKey || !signMessage || loading !== 'wallet') return

    const authenticateWallet = async () => {
      try {
        setError(null)
        const walletAddress = publicKey.toBase58()

        // 1. Get nonce from our Solana plugin (goes through [..all] catch-all)
        const nonceRes = await fetch('/api/auth/solana/nonce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ walletAddress }),
        })

        if (!nonceRes.ok) {
          throw new Error('Failed to generate nonce')
        }

        const { nonce } = await nonceRes.json()

        // 2. Create message and request wallet signature
        const message = `Sign in to Superteam Academy\n\nNonce: ${nonce}\nAddress: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`
        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = await signMessage(messageBytes)
        const signature = bs58.encode(signatureBytes)

        // 3. Verify via plugin endpoint (goes through [..all] catch-all)
        // This calls setSessionCookie internally — same mechanism as OAuth
        const verifyRes = await fetch('/api/auth/solana/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            walletAddress,
            signature,
            message,
          }),
        })

        if (!verifyRes.ok) {
          const data = await verifyRes
            .json()
            .catch(() => ({ error: 'Verification failed' }))
          throw new Error(
            data?.message || data?.error || 'Wallet verification failed',
          )
        }

        // Success — trigger onboarding check
        posthog.capture('user_signed_in', {
          auth_method: 'wallet',
          wallet_address: walletAddress,
        })
        onWalletAuth()
      } catch (err: unknown) {
        console.error('Wallet auth error:', err)
        if (err instanceof Error && err.message.includes('User rejected')) {
          setError(t('auth.errorSignatureCancelled'))
          await disconnect()
        } else {
          setError(
            err instanceof Error ? err.message : t('auth.errorAuthFailed'),
          )
        }
        setLoading(null)
      }
    }

    authenticateWallet()
  }, [connected, publicKey, signMessage, loading, t, onWalletAuth, disconnect])

  const handleWalletClick = () => {
    setLoading('wallet')
    setError(null)
    if (connected && publicKey) {
      // Already connected, will trigger the useEffect
      return
    }
    setVisible(true)
  }

  const handleGoogleClick = async () => {
    setLoading('google')
    setError(null)
    try {
      posthog.capture('user_signed_in', { auth_method: 'google' })
      await signIn.social({
        provider: 'google',
        callbackURL: `/${locale}/login?callback=google`,
      })
    } catch {
      setError(t('auth.errorGoogleFailed'))
      setLoading(null)
    }
  }

  const handleGithubClick = async () => {
    setLoading('github')
    setError(null)
    try {
      posthog.capture('user_signed_in', { auth_method: 'github' })
      await signIn.social({
        provider: 'github',
        callbackURL: `/${locale}/login?callback=github`,
      })
    } catch {
      setError(t('auth.errorGithubFailed'))
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.22 }}
    >
      {/* Brand header */}
      <div className='text-center mb-8'>
        <div
          className='w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[1.6rem]'
          style={{
            background: 'hsl(var(--green-primary) / 0.15)',
            border: '1px solid hsl(var(--green-primary) / 0.25)',
          }}
        >
          🎓
        </div>
        <h1 className='font-display text-[1.5rem] font-black text-cream tracking-tight'>
          {t('auth.welcome')}
        </h1>
        <p className='font-ui text-[0.78rem] text-cream/45 mt-1.5'>
          {t('auth.subtitle')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-4 p-3 rounded-xl text-center'
          style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
          }}
        >
          <p className='font-ui text-[0.75rem]' style={{ color: '#dc3545' }}>
            {error}
          </p>
        </motion.div>
      )}

      {/* Auth options */}
      <div className='flex flex-col gap-3'>
        {/* Wallet — primary */}
        <button
          onClick={handleWalletClick}
          disabled={!!loading}
          className='w-full flex items-center gap-3 px-5 py-4 rounded-xl font-ui text-[0.88rem] font-semibold transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed'
          style={{
            background: 'hsl(var(--green-primary))',
            boxShadow: '0 4px 20px hsl(var(--green-primary) / 0.4)',
            color: 'hsl(var(--cream))',
          }}
        >
          {loading === 'wallet' ? (
            <Loader2 size={18} className='animate-spin' />
          ) : (
            <Wallet size={18} strokeWidth={1.5} />
          )}
          <span>{t('auth.connectWallet')}</span>
          <div className='ml-auto flex items-center gap-1.5'>
            <ChevronRight size={14} strokeWidth={1.5} />
          </div>
        </button>

        <div className='flex items-center gap-3 my-1'>
          <div
            className='flex-1 h-px'
            style={{ background: 'hsl(var(--cream) / 0.08)' }}
          />
          <span className='font-ui text-[0.64rem] text-cream/30 uppercase tracking-wider'>
            {t('auth.orContinueWith')}
          </span>
          <div
            className='flex-1 h-px'
            style={{ background: 'hsl(var(--cream) / 0.08)' }}
          />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleClick}
          disabled={!!loading}
          className='w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-ui text-[0.84rem] font-semibold transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-70'
          style={{
            background: '#fff',
            color: '#1b231d',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}
        >
          {loading === 'google' ? (
            <Loader2 size={17} className='animate-spin text-charcoal' />
          ) : (
            <span
              className='w-5 h-5 flex items-center justify-center font-black text-[0.75rem]'
              style={{ color: '#4285f4' }}
            >
              G
            </span>
          )}
          {t('auth.continueGoogle')}
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className='ml-auto text-charcoal/30'
          />
        </button>

        {/* GitHub */}
        <button
          onClick={handleGithubClick}
          disabled={!!loading}
          className='w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-ui text-[0.84rem] font-semibold transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-70'
          style={{
            background: '#1b1f23',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          {loading === 'github' ? (
            <Loader2 size={17} className='animate-spin' />
          ) : (
            <Github size={17} strokeWidth={1.5} />
          )}
          {t('auth.continueGithub')}
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className='ml-auto opacity-30'
          />
        </button>
      </div>

      <p className='font-ui text-[0.6rem] text-cream/25 text-center mt-6 leading-relaxed'>
        {t('auth.termsText')}{' '}
        <a
          href='#'
          className='underline underline-offset-2 hover:text-cream/50 transition-colors'
        >
          {t('auth.termsLink')}
        </a>{' '}
        and{' '}
        <a
          href='#'
          className='underline underline-offset-2 hover:text-cream/50 transition-colors'
        >
          {t('auth.privacyLink')}
        </a>
      </p>
    </motion.div>
  )
}

// ─── Step 1: Onboarding Form ─────────────────────────────────────

function OnboardingStep({
  authMethod,
  onComplete,
  user,
}: {
  authMethod: AuthMethod
  onComplete: () => void
  user?: User
}) {
  const t = useTranslations('login')
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [bio, setBio] = useState(user?.bio || '')
  const [twitter, setTwitter] = useState(user?.twitter || '')
  const [github, setGithub] = useState(user?.github || '')
  const [linkedin, setLinkedin] = useState(user?.linkedin || '')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const { connected, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsWallet = authMethod === 'google' || authMethod === 'github'
  const walletConnected = connected && !!publicKey

  /** Twitter-style validation: starts with letter, lowercase letters/numbers/underscores, 3-30 chars */
  const validateUsername = (val: string): string | null => {
    if (!val) return null
    if (val.length < 3) return t('validation.minLength')
    if (val.length > 30) return t('validation.maxLength')
    if (/^\d/.test(val)) return t('validation.noNumberStart')
    if (/\s/.test(val)) return t('validation.noSpaces')
    if (/-/.test(val)) return t('validation.useUnderscores')
    if (!/^[a-z][a-z0-9_]{2,29}$/.test(val)) return t('validation.invalidChars')
    return null
  }

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(cleaned)
    setUsernameError(validateUsername(cleaned))
  }

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length >= 3 &&
    !usernameError &&
    (!needsWallet || walletConnected)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    try {
      // Update user profile in Better Auth
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          twitter: twitter.trim(),
          github: github.trim(),
          linkedin: linkedin.trim(),
          telegram: telegram.trim(),
          walletAddress: publicKey?.toBase58() || '',
          onboardingComplete: true,
        }),
      })

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: 'Failed to save profile' }))
        // Show specific server errors (e.g. 'Username is already taken')
        throw new Error(data.error || 'Failed to save profile')
      }

      posthog.identify(username.trim().toLowerCase(), {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        auth_method: authMethod,
        has_wallet: !!publicKey,
      })
      posthog.capture('user_signed_up', {
        auth_method: authMethod,
        has_wallet: !!publicKey,
      })

      // Award 100 XP for completing account setup
      try {
        if (user?.id) {
          await awardSignupXP(user.id)
        }
      } catch (err) {
        console.error('Failed to award signup XP:', err)
        // Don't block onboarding if XP award fails
      }

      onComplete()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      // Show username-specific errors inline
      if (msg.toLowerCase().includes('username')) {
        setUsernameError(msg)
      } else {
        setError(msg)
      }
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.22 }}
    >
      <StepDots current={0} total={2} />

      <div className='text-center mb-6'>
        <h2 className='font-display text-[1.35rem] font-black text-cream tracking-tight'>
          {t('onboarding.title')}
        </h2>
        <p className='font-ui text-[0.74rem] text-cream/40 mt-1'>
          {t('onboarding.subtitle')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className='mb-4 p-3 rounded-xl text-center'
          style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
          }}
        >
          <p className='font-ui text-[0.75rem]' style={{ color: '#dc3545' }}>
            {error}
          </p>
        </div>
      )}

      {/* Wallet connect banner (only for social logins) */}
      {needsWallet && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className='mb-5 p-4 rounded-xl border flex items-center justify-between gap-3'
          style={{
            background: walletConnected
              ? 'hsl(var(--green-primary) / 0.08)'
              : 'hsl(var(--amber) / 0.08)',
            borderColor: walletConnected
              ? 'hsl(var(--green-primary) / 0.3)'
              : 'hsl(var(--amber) / 0.3)',
          }}
        >
          <div className='flex items-start gap-2.5'>
            <span className='text-[1rem] mt-0.5'>
              {walletConnected ? '✅' : '👻'}
            </span>
            <div>
              <p
                className='font-ui text-[0.76rem] font-semibold'
                style={{
                  color: walletConnected
                    ? 'hsl(var(--green-mint))'
                    : 'hsl(var(--amber))',
                }}
              >
                {walletConnected
                  ? t('onboarding.walletConnected')
                  : t('onboarding.connectWallet')}
              </p>
              <p className='font-ui text-[0.62rem] text-cream/40 mt-0.5'>
                {walletConnected
                  ? t('onboarding.walletSubConnected', {
                      address: truncateAddress(publicKey!.toBase58()),
                    })
                  : t('onboarding.walletSubDisconnected')}
              </p>
            </div>
          </div>
          {!walletConnected ? (
            <button
              onClick={() => setVisible(true)}
              className='flex-shrink-0 flex items-center gap-1.5 font-ui text-[0.7rem] font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all'
              style={{
                background: 'hsl(var(--amber) / 0.15)',
                border: '1px solid hsl(var(--amber) / 0.3)',
                color: 'hsl(var(--amber))',
              }}
            >
              <Wallet size={12} strokeWidth={1.5} />
              {t('onboarding.connect')}
            </button>
          ) : (
            <button
              onClick={() => disconnect()}
              className='flex-shrink-0 flex items-center gap-1.5 font-ui text-[0.7rem] font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all'
              style={{
                background: 'hsl(var(--green-primary) / 0.15)',
                border: '1px solid hsl(var(--green-primary) / 0.3)',
                color: 'hsl(var(--green-mint))',
              }}
            >
              {t('onboarding.disconnect')}
            </button>
          )}
        </motion.div>
      )}

      {/* Avatar */}
      <div className='flex justify-center mb-5'>
        <button className='relative group cursor-pointer'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center text-[1.75rem] border-2 border-dashed transition-colors group-hover:border-green-primary/50'
            style={{ borderColor: 'hsl(var(--cream) / 0.2)' }}
          >
            🧑‍💻
          </div>
          <div
            className='absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center'
            style={{ background: 'hsl(var(--green-primary))' }}
          >
            <span className='text-[0.55rem]'>📷</span>
          </div>
        </button>
      </div>

      {/* Form fields */}
      <div className='flex flex-col gap-3.5'>
        {/* Name + Username */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1.5'>
            <label className='font-ui text-[0.7rem] font-semibold text-cream/60'>
              {t('onboarding.displayName')}{' '}
              <span className='text-amber'>*</span>
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboarding.placeholderName')}
              className='w-full px-3 py-2.5 rounded-xl font-ui text-[0.8rem] text-cream focus:outline-none transition-colors placeholder:text-cream/25'
              style={{
                background: 'hsl(var(--green-hero) / 0.5)',
                border: '1px solid hsl(var(--cream) / 0.12)',
              }}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='font-ui text-[0.7rem] font-semibold text-cream/60'>
              {t('onboarding.username')} <span className='text-amber'>*</span>
            </label>
            <input
              type='text'
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder={t('onboarding.placeholderUsername')}
              maxLength={30}
              className='w-full px-3 py-2.5 rounded-xl font-ui text-[0.8rem] text-cream focus:outline-none transition-colors placeholder:text-cream/25'
              style={{
                background: 'hsl(var(--green-hero) / 0.5)',
                border: usernameError
                  ? '1px solid rgba(220, 53, 69, 0.5)'
                  : '1px solid hsl(var(--cream) / 0.12)',
              }}
            />
            {usernameError && (
              <p
                className='font-ui text-[0.62rem]'
                style={{ color: '#dc3545' }}
              >
                {usernameError}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className='flex flex-col gap-1.5'>
          <label className='font-ui text-[0.7rem] font-semibold text-cream/60'>
            {t('onboarding.bio')}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('onboarding.placeholderBio')}
            rows={2}
            className='w-full px-3 py-2.5 rounded-xl font-ui text-[0.8rem] text-cream focus:outline-none resize-none transition-colors placeholder:text-cream/25'
            style={{
              background: 'hsl(var(--green-hero) / 0.5)',
              border: '1px solid hsl(var(--cream) / 0.12)',
            }}
          />
        </div>

        {/* Social links */}
        <div>
          <p className='font-ui text-[0.7rem] font-semibold text-cream/60 mb-2'>
            {t('onboarding.socialLinks')}{' '}
            <span className='font-normal text-cream/30'>
              {t('onboarding.optional')}
            </span>
          </p>
          <div className='flex flex-col gap-2'>
            <SocialInput
              icon={<span className='text-[0.8rem]'>𝕏</span>}
              prefix='x.com/'
              placeholder='username'
              value={twitter}
              onChange={setTwitter}
            />
            <SocialInput
              icon={<Github size={12} strokeWidth={1.5} />}
              prefix='github.com/'
              placeholder='username'
              value={github}
              onChange={setGithub}
            />
            <SocialInput
              icon={<Linkedin size={11} strokeWidth={1.5} />}
              prefix='linkedin.com/in/'
              placeholder='username'
              value={linkedin}
              onChange={setLinkedin}
            />
            <SocialInput
              icon={<Send size={11} strokeWidth={1.5} />}
              prefix='@'
              placeholder='telegram'
              value={telegram}
              onChange={setTelegram}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className='w-full flex items-center justify-center gap-2.5 mt-5 px-5 py-3.5 rounded-xl font-ui text-[0.88rem] font-semibold transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
        style={{
          background: canSubmit
            ? 'hsl(var(--green-primary))'
            : 'hsl(var(--green-primary) / 0.4)',
          color: 'hsl(var(--cream))',
          boxShadow: canSubmit
            ? '0 4px 20px hsl(var(--green-primary) / 0.4)'
            : 'none',
        }}
      >
        {submitting ? (
          <Loader2 size={17} className='animate-spin' />
        ) : (
          <>
            {t('onboarding.completeSetup')}
            <ArrowRight size={16} strokeWidth={2} />
          </>
        )}
      </button>

      {needsWallet && !walletConnected && (
        <p className='font-ui text-[0.6rem] text-amber/60 text-center mt-2'>
          {t('onboarding.walletWarning')}
        </p>
      )}
    </motion.div>
  )
}

// ─── Step 2: Success ─────────────────────────────────────────────

function SuccessStep() {
  const t = useTranslations('login')
  const locale = useLocale()
  const router = useRouter()
  const { refetch } = useSession()

  // Floating XP orbs
  const orbs = [
    { emoji: '⚡', x: -60, y: -40, delay: 0 },
    { emoji: '🏆', x: 55, y: -55, delay: 0.1 },
    { emoji: '✨', x: -45, y: 30, delay: 0.2 },
    { emoji: '🎯', x: 50, y: 35, delay: 0.15 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      className='text-center'
    >
      {/* XP celebration */}
      <div className='relative flex justify-center mb-6'>
        <div
          className='w-24 h-24 rounded-full flex items-center justify-center text-[2.4rem]'
          style={{
            background: 'hsl(var(--green-primary) / 0.15)',
            border: '2px solid hsl(var(--green-primary) / 0.25)',
            boxShadow: '0 0 40px hsl(var(--green-primary) / 0.3)',
          }}
        >
          🎉
        </div>
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x: orb.x, y: orb.y }}
            transition={{
              delay: orb.delay + 0.2,
              duration: 0.5,
              type: 'spring',
            }}
            className='absolute top-1/2 left-1/2 text-[1.15rem] -translate-x-1/2 -translate-y-1/2'
          >
            {orb.emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className='font-display text-[1.5rem] font-black text-cream tracking-tight mb-2'>
          {t('success.title')}
        </h2>
        <p className='font-ui text-[0.76rem] text-cream/45 mb-6'>
          {t('success.subtitle')}
        </p>

        {/* XP earned */}
        <div
          className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl mb-6'
          style={{
            background: 'hsl(var(--amber) / 0.1)',
            border: '1px solid hsl(var(--amber) / 0.25)',
          }}
        >
          <Zap size={14} strokeWidth={1.5} className='text-amber' />
          <span className='font-ui text-[0.78rem] font-semibold text-amber'>
            {t('success.xpEarned')}
          </span>
        </div>

        <button
          onClick={async () => {
            await refetch()
            router.push(`/${locale}/dashboard`)
          }}
          className='flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl font-ui text-[0.88rem] font-semibold transition-all hover:-translate-y-0.5 cursor-pointer'
          style={{
            background: 'hsl(var(--green-primary))',
            color: 'hsl(var(--cream))',
            boxShadow: '0 4px 20px hsl(var(--green-primary) / 0.4)',
          }}
        >
          {t('success.goToDashboard')}
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Login Component ────────────────────────────────────────

const Login = () => {
  const t = useTranslations('login')
  const locale = useLocale()
  const [step, setStep] = useState<Step>('auth')
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const { connected, disconnect } = useWallet()

  // Disconnect wallet on page load to allow wallet selection
  useEffect(() => {
    if (connected && step === 'auth') {
      disconnect().catch((err) => {
        console.error('Failed to disconnect wallet on login page load:', err)
      })
    }
  }, []) // Run only once on mount

  useEffect(() => {
    if (isPending) return
    if (session?.user) {
      const user = session.user
      if (user.onboardingComplete) {
        router.replace(`/${locale}/dashboard`)
      } else {
        // Auto-populate GitHub username if available
        // if (user.username && typeof user.username === 'string') {
        //   setGithubUsername(user.username)
        // }
        setStep('onboarding')
      }
    }
  }, [session, isPending, router, locale])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const callback = params.get('callback')
    if (callback && session?.user) {
      const user = session.user as Record<string, unknown>
      setAuthMethod(callback as AuthMethod)
      if (user.onboardingComplete) {
        router.replace(`/${locale}/dashboard`)
      } else {
        // if (callback === 'github' && user.username) {
        //   setGithubUsername(user.username as string)
        // }
        setStep('onboarding')
      }
    }
  }, [session, locale, router])

  const handleAuthSelect = (method: AuthMethod) => {
    setAuthMethod(method)
    // For wallet, the auth flow is handled in AuthStep via useEffect
    // For Google/GitHub, the redirect happens in AuthStep
  }

  const handleWalletAuth = useCallback(async () => {
    setAuthMethod('wallet')
    // Refetch session so useSession has fresh data
    await refetch()
    setStep('onboarding')
  }, [refetch])

  const handleOnboardingComplete = () => {
    setStep('success')
  }

  return (
    <div
      className='min-h-screen w-full flex items-center justify-center relative overflow-hidden'
      style={{ background: 'hsl(var(--green-hero))' }}
    >
      {/* Background texture */}
      <div className='absolute inset-0 pattern-diagonal opacity-30' />

      {/* Ambient glows */}
      <div
        className='absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2'
        style={{
          background:
            'radial-gradient(circle, hsl(var(--green-primary) / 0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className='absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none translate-x-1/2 translate-y-1/2'
        style={{
          background:
            'radial-gradient(circle, hsl(var(--amber) / 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div className='relative z-10 w-full max-w-md mx-4'>
        <div
          className='rounded-3xl p-8'
          style={{
            background: 'hsl(var(--charcoal-mid) / 0.95)',
            border: '1px solid hsl(var(--cream) / 0.07)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode='wait'>
            {step === 'auth' && (
              <AuthStep
                key='auth'
                onSelect={handleAuthSelect}
                onWalletAuth={handleWalletAuth}
              />
            )}
            {step === 'onboarding' && (
              <OnboardingStep
                key='onboarding'
                authMethod={authMethod}
                onComplete={handleOnboardingComplete}
                user={session?.user}
              />
            )}
            {step === 'success' && <SuccessStep key='success' />}
          </AnimatePresence>
        </div>

        {step === 'auth' && (
          <p className='text-center font-ui text-[0.65rem] text-cream/20 mt-4'>
            {t('footer.branding')}
          </p>
        )}
      </div>
    </div>
  )
}

export default Login
