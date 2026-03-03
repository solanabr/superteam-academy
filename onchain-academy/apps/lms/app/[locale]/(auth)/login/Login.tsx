'use client'

import { truncateAddress } from '@/libs/string'
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
import { useState } from 'react'

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

function AuthStep({ onSelect }: { onSelect: (method: AuthMethod) => void }) {
  const [loading, setLoading] = useState<AuthMethod>(null)

  const handleSelect = (method: AuthMethod) => {
    setLoading(method)
    setTimeout(() => {
      setLoading(null)
      onSelect(method)
    }, 900)
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
          Welcome back
        </h1>
        <p className='font-ui text-[0.78rem] text-cream/45 mt-1.5'>
          Sign in to continue your Solana journey
        </p>
      </div>

      {/* Auth options */}
      <div className='flex flex-col gap-3'>
        {/* Wallet — primary */}
        <button
          onClick={() => handleSelect('wallet')}
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
          <span>Connect Wallet</span>
          <div className='ml-auto flex items-center gap-1.5'>
            <span className='font-ui text-[0.62rem] font-normal opacity-65'>
              Phantom · Backpack
            </span>
            <ChevronRight size={14} strokeWidth={1.5} />
          </div>
        </button>

        <div className='flex items-center gap-3 my-1'>
          <div
            className='flex-1 h-px'
            style={{ background: 'hsl(var(--cream) / 0.08)' }}
          />
          <span className='font-ui text-[0.64rem] text-cream/30 uppercase tracking-wider'>
            or continue with
          </span>
          <div
            className='flex-1 h-px'
            style={{ background: 'hsl(var(--cream) / 0.08)' }}
          />
        </div>

        {/* Google */}
        <button
          onClick={() => handleSelect('google')}
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
          Continue with Google
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className='ml-auto text-charcoal/30'
          />
        </button>

        {/* GitHub */}
        <button
          onClick={() => handleSelect('github')}
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
          Continue with GitHub
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className='ml-auto opacity-30'
          />
        </button>
      </div>

      <p className='font-ui text-[0.6rem] text-cream/25 text-center mt-6 leading-relaxed'>
        By signing in you agree to our{' '}
        <a
          href='#'
          className='underline underline-offset-2 hover:text-cream/50 transition-colors'
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href='#'
          className='underline underline-offset-2 hover:text-cream/50 transition-colors'
        >
          Privacy Policy
        </a>
      </p>
    </motion.div>
  )
}

// ─── Step 1: Onboarding Form ─────────────────────────────────────

function OnboardingStep({
  authMethod,
  onComplete,
}: {
  authMethod: AuthMethod
  onComplete: () => void
}) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [telegram, setTelegram] = useState('')
  const [walletConnected, setWalletConnected] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const needsWallet = authMethod === 'google' || authMethod === 'github'

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    (!needsWallet || walletConnected)

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      onComplete()
    }, 1100)
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
          Set up your profile
        </h2>
        <p className='font-ui text-[0.74rem] text-cream/40 mt-1'>
          Tell the community who you are
        </p>
      </div>

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
                  ? 'Wallet connected!'
                  : 'Connect a wallet to earn XP'}
              </p>
              <p className='font-ui text-[0.62rem] text-cream/40 mt-0.5'>
                {walletConnected
                  ? `${truncateAddress('7xKX...4mNp')} · You can earn on-chain credentials`
                  : 'Required to receive XP, achievements, and on-chain certificates'}
              </p>
            </div>
          </div>
          {!walletConnected && (
            <button
              onClick={() => setWalletConnected(true)}
              className='flex-shrink-0 flex items-center gap-1.5 font-ui text-[0.7rem] font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all'
              style={{
                background: 'hsl(var(--amber) / 0.15)',
                border: '1px solid hsl(var(--amber) / 0.3)',
                color: 'hsl(var(--amber))',
              }}
            >
              <Wallet size={12} strokeWidth={1.5} />
              Connect
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
              Full Name <span className='text-amber'>*</span>
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Alex Rivera'
              className='w-full px-3 py-2.5 rounded-xl font-ui text-[0.8rem] text-cream focus:outline-none transition-colors placeholder:text-cream/25'
              style={{
                background: 'hsl(var(--green-hero) / 0.5)',
                border: '1px solid hsl(var(--cream) / 0.12)',
              }}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='font-ui text-[0.7rem] font-semibold text-cream/60'>
              Username <span className='text-amber'>*</span>
            </label>
            <input
              type='text'
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))
              }
              placeholder='alex_dev'
              className='w-full px-3 py-2.5 rounded-xl font-ui text-[0.8rem] text-cream focus:outline-none transition-colors placeholder:text-cream/25'
              style={{
                background: 'hsl(var(--green-hero) / 0.5)',
                border: '1px solid hsl(var(--cream) / 0.12)',
              }}
            />
          </div>
        </div>

        {/* Bio */}
        <div className='flex flex-col gap-1.5'>
          <label className='font-ui text-[0.7rem] font-semibold text-cream/60'>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder='Building on Solana · Rust enthusiast · LatAm native...'
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
            Social Links{' '}
            <span className='font-normal text-cream/30'>(optional)</span>
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
            Complete setup
            <ArrowRight size={16} strokeWidth={2} />
          </>
        )}
      </button>

      {needsWallet && !walletConnected && (
        <p className='font-ui text-[0.6rem] text-amber/60 text-center mt-2'>
          ⚠ Connect a wallet to enable XP earning before completing setup
        </p>
      )}
    </motion.div>
  )
}

// ─── Step 2: Success ─────────────────────────────────────────────

function SuccessStep() {
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
          You&apos;re all set! 🚀
        </h2>
        <p className='font-ui text-[0.76rem] text-cream/45 mb-6'>
          Welcome to Superteam Academy. Your learning journey starts now.
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
            +50 XP earned for completing your profile!
          </span>
        </div>

        <a
          href='/en/dashboard'
          className='flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl font-ui text-[0.88rem] font-semibold transition-all hover:-translate-y-0.5'
          style={{
            background: 'hsl(var(--green-primary))',
            color: 'hsl(var(--cream))',
            boxShadow: '0 4px 20px hsl(var(--green-primary) / 0.4)',
          }}
        >
          Go to Dashboard
          <ArrowRight size={16} strokeWidth={2} />
        </a>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Login Component ────────────────────────────────────────

const Login = () => {
  const [step, setStep] = useState<Step>('auth')
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)

  const handleAuthSelect = (method: AuthMethod) => {
    setAuthMethod(method)
    setStep('onboarding')
  }

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
              <AuthStep key='auth' onSelect={handleAuthSelect} />
            )}
            {step === 'onboarding' && (
              <OnboardingStep
                key='onboarding'
                authMethod={authMethod}
                onComplete={handleOnboardingComplete}
              />
            )}
            {step === 'success' && <SuccessStep key='success' />}
          </AnimatePresence>
        </div>

        {/* Bottom link */}
        {step === 'auth' && (
          <p className='text-center font-ui text-[0.65rem] text-cream/20 mt-4'>
            Superteam Academy · Powered by Solana
          </p>
        )}
      </div>
    </div>
  )
}

export default Login
