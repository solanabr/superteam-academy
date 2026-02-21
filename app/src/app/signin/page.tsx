'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import {
  Github,
  Mail,
  Wallet,
  ArrowRight,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

export default function SignInPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSignIn = async (provider: 'google' | 'github' | 'wallet', data?: any) => {
    setLoading(provider)
    setError('')
    
    try {
      await signIn(provider, data)
      router.push('/dashboard')
    } catch (error) {
      setError('Failed to sign in. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleDemoSignIn = async () => {
    await handleSignIn('github', {
      login: 'demo_user',
      name: 'Demo User',
      avatar_url: '/images/demo-avatar.jpg',
      id: 12345,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          className="w-full max-w-md"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to continue your Solana learning journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Demo Sign In (for development) */}
              <Button
                onClick={handleDemoSignIn}
                disabled={loading !== null}
                className="w-full gap-2"
                size="lg"
              >
                <Zap className="h-4 w-4" />
                {loading === 'demo' ? 'Signing in...' : 'Demo Sign In (Development)'}
              </Button>

              <Separator />

              {/* Social Sign In Options */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => handleSignIn('google', {
                    id: 'google_123',
                    email: 'user@example.com',
                    name: 'Google User',
                    image: '/images/default-avatar.jpg'
                  })}
                  disabled={loading !== null}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Mail className="h-4 w-4" />
                  {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSignIn('github', {
                    id: 'github_123',
                    login: 'github_user',
                    name: 'GitHub User',
                    avatar_url: '/images/default-avatar.jpg'
                  })}
                  disabled={loading !== null}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Github className="h-4 w-4" />
                  {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSignIn('wallet', {
                    walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
                  })}
                  disabled={loading !== null}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Wallet className="h-4 w-4" />
                  {loading === 'wallet' ? 'Connecting...' : 'Connect with Solana Wallet'}
                </Button>
              </div>

              <Separator />

              {/* Email Form (placeholder) */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  disabled
                >
                  Continue with Email
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Email authentication coming soon
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}