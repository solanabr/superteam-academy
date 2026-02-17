'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useRouter } from '@/i18n/routing'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Shield, Mail, Lock, ArrowRight, Loader2, Github, Chrome } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@example.com'
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo1234'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('Auth')
  const { signMessage, connected } = useWallet()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
      }
    }
    checkUser()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
              {t('loginTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('loginSubtitle')}
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-2xl">
            <CardContent className="pt-8">
              <form onSubmit={handleLogin} className="space-y-6">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('passwordLabel')}</Label>
                    </div>
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
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      {t('loginButton')}
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
                    setError(null)
                    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}${location.pathname}` } })
                    if (error) {
                      setError(error.message)
                    }
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
                      setError(null)
                      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}${location.pathname}` } })
                      if (error) {
                        setError(error.message)
                      }
                    }}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
                
                <Button
                  type="button"
                  variant="default"
                  className="w-full h-11 rounded-xl"
                  onClick={async () => {
                    const supabase = createClient()
                    setError(null)
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!connected || !signMessage) {
                      setError('Connect your wallet to continue')
                      return
                    }
                    const encoder = new TextEncoder()
                    const message = encoder.encode(`Sign in with wallet • ${new Date().toISOString()}`)
                    try {
                      await signMessage(message)
                      if (user) {
                        router.push('/dashboard')
                        return
                      }
                      router.push('/auth/sign-up?wallet=1')
                    } catch {
                      setError('Wallet signature failed')
                    }
                  }}
                >
                  Sign in with Wallet
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                  onClick={async () => {
                    const supabase = createClient()
                    setIsLoading(true)
                    setError(null)
                    try {
                      const { error } = await supabase.auth.signInWithPassword({
                        email: DEMO_EMAIL,
                        password: DEMO_PASSWORD,
                      })
                      if (error) throw error
                      router.push('/dashboard')
                    } catch (error: unknown) {
                      setError(error instanceof Error ? error.message : 'Demo login failed')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  {t('demoLoginButton')}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{t('noAccount')}</span>{' '}
                  <Link
                    href="/auth/sign-up"
                    className="font-bold text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-all"
                  >
                    {t('signUpLink')}
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

