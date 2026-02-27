'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useRouter } from '@/i18n/routing'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UserPlus, Mail, Lock, ArrowRight, Loader2, Github, Chrome } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'

const PENDING_WALLET_SIGNUP_KEY = 'pending_wallet_signup_address'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('Auth')
  const { signMessage, connected, publicKey } = useWallet()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      const params = new URLSearchParams(window.location.search)
      const isWalletSignupFlow = params.get('wallet') === '1'
      const pendingWalletAddress = localStorage.getItem(PENDING_WALLET_SIGNUP_KEY)

      if (isWalletSignupFlow && pendingWalletAddress) {
        await supabase
          .from('profiles')
          .update({
            wallet_address: pendingWalletAddress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        localStorage.removeItem(PENDING_WALLET_SIGNUP_KEY)
      }

      router.replace('/dashboard')
    }

    checkUser()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t('passwordsDoNotMatch'))
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletGoogleSignup = async () => {
    if (!connected || !signMessage || !publicKey) {
      setError('Connect your wallet to continue')
      return
    }

    setError(null)
    setIsWalletLoading(true)

    const encoder = new TextEncoder()
    const message = encoder.encode(`Create account with wallet + Gmail - ${new Date().toISOString()}`)

    try {
      await signMessage(message)

      localStorage.setItem(PENDING_WALLET_SIGNUP_KEY, publicKey.toString())

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}${location.pathname}?wallet=1`,
        },
      })

      if (error) throw error
    } catch (walletError: unknown) {
      setError(walletError instanceof Error ? walletError.message : 'Wallet sign-up failed')
      localStorage.removeItem(PENDING_WALLET_SIGNUP_KEY)
      setIsWalletLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
              {t('signUpTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('signUpSubtitle')}
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-2xl">
            <CardContent className="pt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t('emailLabel')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('passwordLabel')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{t('repeatPasswordLabel')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Wallet sign-up requires linking Google (Gmail).
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    className="w-full h-11 rounded-xl"
                    onClick={handleWalletGoogleSignup}
                    disabled={isWalletLoading}
                  >
                    {isWalletLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Linking Gmail...
                      </>
                    ) : (
                      'Sign up with Wallet + Gmail'
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-bold rounded-xl shadow-[0_0_20px_rgba(20,241,149,0.1)] hover:shadow-[0_0_30px_rgba(20,241,149,0.2)] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('signingUp')}
                    </>
                  ) : (
                    <>
                      {t('signUpButton')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}${location.pathname}` } })
                    }}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}${location.pathname}` } })
                    }}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{t('hasAccount')}</span>{' '}
                  <Link
                    href="/auth/login"
                    className="font-bold text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-all"
                  >
                    {t('loginLink')}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
