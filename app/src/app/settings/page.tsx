'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from 'next-themes'
import type { User, UserPreferences } from '@/types'
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Wallet,
  Github,
  Mail,
  Trash2,
  Save,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

export default function SettingsPage() {
  const { user, updateUser, linkWallet, unlinkWallet, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState<Partial<User>>({})
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      achievements: true,
      courseUpdates: true,
    },
    privacy: {
      showProfile: true,
      showProgress: true,
      showAchievements: true,
    },
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    
    setFormData({
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    })
    setPreferences(user.preferences)
  }, [user, router])

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      await updateUser({
        ...formData,
        preferences,
      })
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkWallet = async () => {
    // This would integrate with Solana wallet adapter
    try {
      // Mock wallet connection
      const mockWalletAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
      await linkWallet(mockWalletAddress)
    } catch (error) {
      console.error('Failed to link wallet:', error)
    }
  }

  const handleUnlinkWallet = async () => {
    try {
      await unlinkWallet()
    } catch (error) {
      console.error('Failed to unlink wallet:', error)
    }
  }

  const handleDeleteAccount = async () => {
    // This would show a confirmation dialog and delete the account
    console.log('Delete account requested')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Please sign in to access settings</h2>
            <Button asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.avatar} alt={formData.displayName} />
                      <AvatarFallback className="text-lg">
                        {formData.displayName?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Profile Picture</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Change Photo
                        </Button>
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      {(formData.bio || '').length}/160 characters
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="mt-6 space-y-6">
              {/* Connected Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Link your accounts for easier sign-in and verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Google Account */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Google</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.googleId ? user.email : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Button variant={user.googleId ? "outline" : "default"} size="sm">
                      {user.googleId ? (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  {/* GitHub Account */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                        <Github className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div>
                        <h4 className="font-medium">GitHub</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.githubId ? `Connected as @${user.username}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Button variant={user.githubId ? "outline" : "default"} size="sm">
                      {user.githubId ? (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Wallet Connection */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Solana Wallet</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.wallet ? (
                            <>
                              {user.wallet.slice(0, 8)}...{user.wallet.slice(-8)}
                            </>
                          ) : (
                            'Not connected'
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={user.wallet ? "outline" : "default"}
                      size="sm"
                      onClick={user.wallet ? handleUnlinkWallet : handleLinkWallet}
                    >
                      {user.wallet ? (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>

                  {user.wallet && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start space-x-2">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                            Wallet Required for Credentials
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-300">
                            Your connected wallet is required to receive and verify on-chain certificates
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="mt-6 space-y-6">
              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <div className="flex gap-3">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('light')}
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme('system')}
                        className="flex items-center gap-2"
                      >
                        <Monitor className="h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value: 'en' | 'pt-BR' | 'es') => 
                        setPreferences(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">
                          <div className="flex items-center gap-2">
                            <span>🇺🇸</span>
                            English
                          </div>
                        </SelectItem>
                        <SelectItem value="pt-BR">
                          <div className="flex items-center gap-2">
                            <span>🇧🇷</span>
                            Português (Brasil)
                          </div>
                        </SelectItem>
                        <SelectItem value="es">
                          <div className="flex items-center gap-2">
                            <span>🇪🇸</span>
                            Español
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications.push}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, push: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Achievement Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you unlock achievements
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications.achievements}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, achievements: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Course Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications about new lessons and course updates
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications.courseUpdates}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, courseUpdates: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control what information is visible to other users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to view your profile page
                      </p>
                    </div>
                    <Switch
                      checked={preferences.privacy.showProfile}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showProfile: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Learning Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your course progress and XP on your profile
                      </p>
                    </div>
                    <Switch
                      checked={preferences.privacy.showProgress}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showProgress: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Achievements</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your unlocked achievements on your profile
                      </p>
                    </div>
                    <Switch
                      checked={preferences.privacy.showAchievements}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showAchievements: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Information about how your data is used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your learning progress and achievements are stored locally in your browser. 
                    When wallet integration is complete, you can choose to store credentials on-chain 
                    for verification and portability.
                  </p>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Download My Data
                    </Button>
                    <Button variant="outline" size="sm">
                      Privacy Policy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button - Fixed at bottom for non-profile tabs */}
          {activeTab !== 'profile' && (
            <motion.div
              className="sticky bottom-6 flex justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button onClick={handleSaveProfile} disabled={loading} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}