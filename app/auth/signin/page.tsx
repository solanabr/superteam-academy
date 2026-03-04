'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useI18n } from '@/lib/hooks/useI18n'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import dynamic from 'next/dynamic'
import { Lock, Sparkles, Wallet } from 'lucide-react'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

export default function SignIn() {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const {
    signInWithWallet,
    isAuthenticating,
    error: walletError,
    connected,
  } = useWalletAuth()

  const handleSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  const handleWalletSignIn = async () => {
    const success = await signInWithWallet()
    if (success) {
      window.location.href = '/dashboard'
    }
  }

  const providerButtonClass =
    'w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-superteam-navy/60 dark:bg-[#0a1328] dark:text-gray-200 dark:hover:border-superteam-emerald/60 dark:hover:bg-superteam-navy/45 dark:hover:text-superteam-emerald disabled:opacity-50'

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 py-12 dark:from-[#060d1a] dark:via-[#071427] dark:to-[#091224]">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-superteam-emerald/10" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-superteam-navy/25" />

      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-slate-300 bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:border-superteam-navy/50 dark:bg-[#0c1730]/90 dark:shadow-none sm:p-8">
          <div className="mb-7 text-center">
            <span className="mb-4 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800 dark:border-superteam-emerald/45 dark:bg-superteam-emerald/10 dark:text-superteam-emerald">
              <Sparkles size={12} />
              SOLANA AUTH
            </span>
            <h1 className="bg-gradient-to-r from-blue-700 via-solana-purple to-emerald-600 bg-clip-text text-4xl font-display font-bold text-transparent dark:from-neon-cyan dark:via-solana-purple dark:to-neon-green">
              {t('auth.appTitle')}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-gray-300">{t('auth.appSubtitle')}</p>
          </div>

          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-slate-600 dark:text-gray-300">
              {t('auth.signInOrCreate')}
            </p>

            <div className="space-y-2">
              {!connected ? (
                <div className="w-full">
                  <WalletMultiButton className="!h-auto !w-full !justify-center !rounded-xl !border-2 !border-superteam-emerald/45 !bg-gradient-to-r !from-solana-purple !via-solana-purple !to-blue-500 !px-4 !py-3 !text-base !font-semibold !text-white !shadow-sm hover:!from-solana-purple/90 hover:!to-blue-600 dark:!border-neon-cyan/45 dark:!to-neon-cyan" />
                </div>
              ) : (
                <button
                  onClick={handleWalletSignIn}
                  disabled={isAuthenticating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-superteam-emerald/45 bg-gradient-to-r from-solana-purple via-solana-purple to-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:to-blue-600 dark:border-neon-cyan/45 dark:to-neon-cyan disabled:opacity-50"
                >
                  <Lock size={18} />
                  {isAuthenticating ? t('auth.connecting') : t('auth.signInWithWallet')}
                </button>
              )}
              {walletError && <p className="text-center text-xs text-red-600 dark:text-red-300">{walletError}</p>}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-superteam-navy/55" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 uppercase tracking-wide text-slate-500 dark:bg-[#0c1730] dark:text-gray-400">or</span>
              </div>
            </div>

            <button onClick={() => handleSignIn('google')} disabled={isLoading} className={providerButtonClass}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? t('auth.signingIn') : t('auth.continueGoogle')}
            </button>

            <button onClick={() => handleSignIn('github')} disabled={isLoading} className={providerButtonClass}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {isLoading ? t('auth.signingIn') : t('auth.continueGithub')}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-superteam-navy/55 dark:bg-[#091226]">
            <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">
              <Wallet size={12} />
              Account Access
            </p>
            <p className="text-xs text-slate-600 dark:text-gray-400">
              ✓ {t('auth.infoSignIn')}
              <br />
              ✓ {t('auth.infoSignUp')}
              <br />
              ✓ {t('auth.infoPrivacy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
