'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import {
  Github,
  Mail,
  Wallet,
  ArrowRight,
  Zap,
  CheckCircle,
  Trophy,
  BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function SignUpPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (provider: 'google' | 'github' | 'wallet', data?: any) => {
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setLoading(provider)
    setError('')
    
    try {
      await signIn(provider, data)
      router.push('/dashboard')
    } catch (error) {
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleDemoSignUp = async () => {
    await handleSignUp('github', {
      login: 'demo_user',
      name: 'Demo User',
      avatar_url: '/images/demo-avatar.jpg',
      id: 12345,
    })
  }

  const benefits = [
    { icon: BookOpen, text: 'Access to all courses' },
    { icon: Trophy, text: 'Earn XP and achievements' },
    { icon: CheckCircle, text: 'Get completion certificates' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Side - Benefits */}
          <motion.div
            className="space-y-8"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Start Your{' '}
                <span className="text-gradient">Solana Journey</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Join thousands of developers building the future of Web3
              </p>
            </motion.div>

            <motion.div className="space-y-6" variants={stagger}>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-gradient-solana rounded-lg flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{benefit.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-muted/50 p-6 rounded-lg border"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Start Learning Immediately</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                No payment required. All courses are free and you can start learning 
                Solana development right away.
              </p>
            </motion.div>
          </motion.div>

          {/* Right Side - Sign Up Form */}
          <motion.div
            className="w-full max-w-md mx-auto"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>
                  Choose your preferred sign-up method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Demo Sign Up (for development) */}
                <Button
                  onClick={handleDemoSignUp}
                  disabled={loading !== null}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Zap className="h-4 w-4" />
                  {loading === 'demo' ? 'Creating account...' : 'Quick Demo Account'}
                </Button>

                <Separator />

                {/* Social Sign Up Options */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSignUp('google', {
                      id: 'google_123',
                      email: email || 'user@example.com',
                      name: 'Google User',
                      image: '/images/default-avatar.jpg'
                    })}
                    disabled={loading !== null}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Mail className="h-4 w-4" />
                    {loading === 'google' ? 'Creating account...' : 'Sign up with Google'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSignUp('github', {
                      id: 'github_123',
                      login: 'new_user',
                      name: 'GitHub User',
                      avatar_url: '/images/default-avatar.jpg'
                    })}
                    disabled={loading !== null}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Github className="h-4 w-4" />
                    {loading === 'github' ? 'Creating account...' : 'Sign up with GitHub'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSignUp('wallet', {
                      walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
                    })}
                    disabled={loading !== null}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Wallet className="h-4 w-4" />
                    {loading === 'wallet' ? 'Creating account...' : 'Sign up with Solana Wallet'}
                  </Button>
                </div>

                <Separator />

                {/* Email Form (placeholder) */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-xs leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              🔒 Your data is secure and we never share it with third parties
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}