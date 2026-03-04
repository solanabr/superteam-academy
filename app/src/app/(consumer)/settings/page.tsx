"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AppLocale } from "@/lib/locale"
import { useI18n } from "@/components/providers/LocaleProvider"
import {
  Wallet, Link2, Save, Trash2, Download, CheckCircle, Unlink, Loader2,
} from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { locale, setLocale, t } = useI18n()
  const user = session?.user
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible: openWalletModal } = useWalletModal()
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUnlinkingWallet, setIsUnlinkingWallet] = useState(false)
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    bio: "",
    twitterHandle: "",
    githubHandle: "",
    websiteUrl: "",
    isProfilePublic: true,
  })

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile")
        if (!res.ok) return
        const data = await res.json()
        const p = data?.user
        if (!mounted || !p) return

        setProfile({
          name: p.name ?? "",
          username: p.username ?? "",
          bio: p.bio ?? "",
          twitterHandle: p.twitterHandle ?? "",
          githubHandle: p.githubHandle ?? "",
          websiteUrl: p.websiteUrl ?? "",
          isProfilePublic: p.isProfilePublic ?? true,
        })
        setLinkedWallet(p.walletAddress ?? null)
      } finally {
        if (mounted) setIsLoadingProfile(false)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          twitterHandle: profile.twitterHandle,
          githubHandle: profile.githubHandle,
          websiteUrl: profile.websiteUrl,
          isProfilePublic: profile.isProfilePublic,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const firstFieldError =
          data?.details && typeof data.details === "object"
            ? Object.values(data.details as Record<string, string[] | undefined>)
                .flat()
                .find(Boolean)
            : null
        toast.error((firstFieldError as string | undefined) ?? data?.error ?? "Failed to save profile")
        return
      }

      toast.success("Profile updated!")
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleUnlinkWallet() {
    setIsUnlinkingWallet(true)
    try {
      await fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: null }),
      })
      setLinkedWallet(null)
      if (connected) disconnect().catch(() => {})
      toast.success("Wallet unlinked from your account")
    } catch {
      toast.error("Failed to unlink wallet")
    } finally {
      setIsUnlinkingWallet(false)
    }
  }

  // Keep linkedWallet state in sync when WalletSyncInner saves a new wallet
  const connectedAddress = publicKey?.toBase58() ?? null
  const displayWallet = connectedAddress ?? linkedWallet

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.pageTitle", "Settings")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("settings.pageSubtitle", "Manage your account preferences and connected services")}
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid grid-cols-4 w-full bg-card border border-border">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">{t("settings.profile", "Profile")}</TabsTrigger>
          <TabsTrigger value="account" className="text-xs sm:text-sm">{t("settings.account", "Account")}</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs sm:text-sm">{t("settings.preferences", "Preferences")}</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs sm:text-sm">{t("settings.privacy", "Privacy")}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Public Profile</CardTitle>
              <CardDescription>This information is shown on your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Your name"
                    className="bg-background border-border"
                    disabled={isLoadingProfile || isSavingProfile}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="@username"
                    className="bg-background border-border"
                    disabled={isLoadingProfile || isSavingProfile}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell the community about yourself..."
                  className="bg-background border-border resize-none"
                  rows={3}
                  disabled={isLoadingProfile || isSavingProfile}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="twitter">Twitter / X</Label>
                  <Input
                    id="twitter"
                    value={profile.twitterHandle}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, twitterHandle: e.target.value }))
                    }
                    placeholder="@handle"
                    className="bg-background border-border"
                    disabled={isLoadingProfile || isSavingProfile}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={profile.githubHandle}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, githubHandle: e.target.value }))
                    }
                    placeholder="username"
                    className="bg-background border-border"
                    disabled={isLoadingProfile || isSavingProfile}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.websiteUrl}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, websiteUrl: e.target.value }))
                  }
                  placeholder="https://yoursite.com"
                  className="bg-background border-border"
                  disabled={isLoadingProfile || isSavingProfile}
                />
              </div>

              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveProfile}
                disabled={isLoadingProfile || isSavingProfile}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingProfile ? t("settings.saving", "Saving...") : t("settings.save", "Save Changes")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Connected Accounts</CardTitle>
              <CardDescription>Manage your sign-in methods and wallet connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>

              {/* Wallet */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Solana Wallet</p>
                    {displayWallet ? (
                      <p className="text-xs font-mono text-muted-foreground">
                        {displayWallet.slice(0, 6)}...{displayWallet.slice(-6)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Required for on-chain credentials</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {displayWallet ? (
                    <>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Linked
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                        onClick={handleUnlinkWallet}
                        disabled={isUnlinkingWallet}
                      >
                        {isUnlinkingWallet ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="w-3 h-3 mr-1.5" />
                            Unlink
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
                      onClick={() => openWalletModal(true)}
                    >
                      <Link2 className="w-3 h-3 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => toast.error("Contact support to delete your account")}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Dark mode is default. You can switch anytime.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeToggle size="sm" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { code: "en", label: "English", flag: "🇺🇸" },
                { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
                { code: "es", label: "Español", flag: "🇲🇽" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    lang.code === locale
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-background border-border hover:border-primary/20"
                  }`}
                  onClick={() => {
                    setLocale(lang.code as AppLocale)
                    toast.success(t("settings.languageSaved", "Language updated"))
                  }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                  {lang.code === locale && (
                    <CheckCircle className="w-4 h-4 ml-auto text-primary" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "streak", label: "Daily streak reminders", desc: "Get notified if you're about to lose your streak" },
                { id: "achievement", label: "Achievement unlocks", desc: "When you earn a new badge or achievement" },
                { id: "leaderboard", label: "Leaderboard updates", desc: "When your rank changes significantly" },
              ].map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch defaultChecked={n.id !== "leaderboard"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Public Profile</p>
                  <p className="text-xs text-muted-foreground">Allow others to see your profile, XP, and achievements</p>
                </div>
                <Switch
                  checked={profile.isProfilePublic}
                  onCheckedChange={(checked) =>
                    setProfile((prev) => ({ ...prev, isProfilePublic: checked }))
                  }
                  disabled={isLoadingProfile || isSavingProfile}
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Show on Leaderboard</p>
                  <p className="text-xs text-muted-foreground">Display your name in the global XP leaderboard</p>
                </div>
                <Switch defaultChecked disabled />
              </div>

              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveProfile}
                disabled={isLoadingProfile || isSavingProfile}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingProfile ? t("settings.saving", "Saving...") : t("settings.savePrivacy", "Save Privacy Settings")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => toast.info("Data export will be emailed to you shortly")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
