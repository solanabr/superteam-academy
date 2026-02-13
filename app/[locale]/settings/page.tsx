'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { userClientService } from '@/lib/services/user.client.service'
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
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import { Settings, User, Globe, Save, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useTheme } from 'next-themes'
import { useWallet } from '@solana/wallet-adapter-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const t = useTranslations('Settings')
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const { publicKey, connected } = useWallet()
  const [linkedGoogle, setLinkedGoogle] = useState(false)
  const [linkedGithub, setLinkedGithub] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const userProfile = await userClientService.getProfile(user.id)
      if (userProfile) {
        setProfile(userProfile)
        setUsername(userProfile.username || '')
        setBio(userProfile.bio || '')
      }
      setIsLoading(false)
      
      setLinkedGoogle(Boolean(user?.identities?.find((i: any) => i.provider === 'google')))
      setLinkedGithub(Boolean(user?.identities?.find((i: any) => i.provider === 'github')))
    }

    loadProfile()
  }, [supabase, router])

  useEffect(() => {
    async function linkWalletAuto() {
      const { data: { user } } = await supabase.auth.getUser()
      if (connected && publicKey && user) {
        await supabase
          .from('profiles')
          .update({ wallet_address: publicKey.toString(), updated_at: new Date().toISOString() })
          .eq('id', user.id)
        const updated = await userClientService.getProfile(user.id)
        if (updated) setProfile(updated)
      }
    }
    linkWalletAuto()
  }, [connected, publicKey, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    setStatus(null)

    try {
      const updated = await userClientService.updateProfile(profile.id, {
        username,
        bio,
      })

      if (updated) {
        setStatus({ type: 'success', message: t('successMessage') })
        setProfile(updated)
      } else {
        setStatus({ type: 'error', message: t('errorMessage') })
      }
    } catch (error) {
      setStatus({ type: 'error', message: t('errorMessage') })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <Settings className="h-10 w-10 text-primary" />
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('profileSection')}
              </CardTitle>
              <CardDescription>
                How others see you on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="username">{t('usernameLabel')}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">{t('bioLabel')}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  placeholder={t('bioPlaceholder')}
                  className="bg-background/50 min-h-[120px]"
                />
              </div>
              {/* Wallet linking moved to Linked Accounts section */}
            </CardContent>
          </Card>

          {/* Language Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('languageSection')}
              </CardTitle>
              <CardDescription>
                Choose your preferred interface language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground italic">
                You can change the language using the switcher in the navigation bar.
              </p>
            </CardContent>
          </Card>

          {/* Appearance & Preferences */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Appearance & Preferences
              </CardTitle>
              <CardDescription>
                Configure theme and app notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="rounded-xl">Light</Button>
                    <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="rounded-xl">Dark</Button>
                    <Button type="button" variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="rounded-xl">System</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notifications</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant={notifications ? 'default' : 'outline'} onClick={() => setNotifications(true)} className="rounded-xl">On</Button>
                    <Button type="button" variant={!notifications ? 'default' : 'outline'} onClick={() => setNotifications(false)} className="rounded-xl">Off</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Accounts */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Linked Accounts
              </CardTitle>
              <CardDescription>
                Connect external accounts to your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Google</Label>
                  <div className="flex items-center gap-3">
                    {linkedGoogle ? (
                      <span className="text-sm text-muted-foreground">Linked</span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user) {
                            router.push('/auth/login')
                            return
                          }
                          await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: `${location.origin}${location.pathname}` } })
                        }}
                      >
                        Link Google
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>GitHub</Label>
                  <div className="flex items-center gap-3">
                    {linkedGithub ? (
                      <span className="text-sm text-muted-foreground">Linked</span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user) {
                            router.push('/auth/login')
                            return
                          }
                          await supabase.auth.linkIdentity({ provider: 'github', options: { redirectTo: `${location.origin}${location.pathname}` } })
                        }}
                      >
                        Link GitHub
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <div className="flex items-center gap-3">
                    {profile?.wallet_address ? (
                      <>
                        <span className="text-xs text-muted-foreground">{profile.wallet_address}</span>
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser()
                            if (!user) return
                            await supabase
                              .from('profiles')
                              .update({ wallet_address: null, updated_at: new Date().toISOString() })
                              .eq('id', user.id)
                            const updated = await userClientService.getProfile(user.id)
                            if (updated) setProfile(updated)
                          }}
                        >
                          <Unlink className="mr-2 h-4 w-4" />
                          Unlink
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user || !publicKey) return
                          await supabase
                            .from('profiles')
                            .update({ wallet_address: publicKey.toString(), updated_at: new Date().toISOString() })
                            .eq('id', user.id)
                          const updated = await userClientService.getProfile(user.id)
                          if (updated) setProfile(updated)
                        }}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link Connected Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${
              status.type === 'success' 
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <p className="font-medium">{status.message}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSaving}
              className="px-8 font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
