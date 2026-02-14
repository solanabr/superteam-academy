"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  User,
  Bell,
  Globe,
  Palette,
  Shield,
  Zap,
  Save,
  Check,
  ExternalLink,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useWallet } from "@solana/wallet-adapter-react";

export default function SettingsPage() {
  const { publicKey, connected, disconnect } = useWallet();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    displayName: "SolDev_BR",
    bio: "Blockchain developer passionate about building on Solana.",
    email: "soldev@example.com",
    language: "pt",
    theme: "system",
    notifications: {
      streakReminders: true,
      newCourses: true,
      weeklyDigest: true,
      challengeAlerts: true
    }
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            <span>Superteam Academy</span>
          </Link>
          <nav className="flex items-center gap-6 ml-8 text-sm">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/challenges" className="text-muted-foreground hover:text-foreground transition-colors">
              Challenges
            </Link>
            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
          <div className="ml-auto">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Wallet Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wallet
              </CardTitle>
              <CardDescription>Your connected Solana wallet</CardDescription>
            </CardHeader>
            <CardContent>
              {connected && publicKey ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm">
                        {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                      </p>
                      <p className="text-sm text-muted-foreground">Connected via Phantom</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://solscan.io/account/${publicKey.toBase58()}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Solscan
                      </a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={disconnect}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">No wallet connected</p>
                  <ConnectButton />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border bg-background resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email (for notifications)</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Theme</label>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" }
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={settings.theme === value ? "default" : "outline"}
                      onClick={() => setSettings({ ...settings, theme: value })}
                      className="flex-1 gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[
                  { value: "pt", label: "Português", flag: "🇧🇷" },
                  { value: "en", label: "English", flag: "🇺🇸" },
                  { value: "es", label: "Español", flag: "🇪🇸" }
                ].map(({ value, label, flag }) => (
                  <Button
                    key={value}
                    variant={settings.language === value ? "default" : "outline"}
                    onClick={() => setSettings({ ...settings, language: value })}
                    className="flex-1 gap-2"
                  >
                    <span>{flag}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "streakReminders", label: "Streak Reminders", description: "Get reminded to maintain your learning streak" },
                { key: "newCourses", label: "New Courses", description: "Be notified when new courses are available" },
                { key: "weeklyDigest", label: "Weekly Digest", description: "Receive a weekly summary of your progress" },
                { key: "challengeAlerts", label: "Challenge Alerts", description: "Get notified about new weekly challenges" }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        [key]: !settings.notifications[key as keyof typeof settings.notifications]
                      }
                    })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.notifications[key as keyof typeof settings.notifications]
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        settings.notifications[key as keyof typeof settings.notifications]
                          ? "translate-x-5"
                          : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Superteam Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by Superteam Brazil
          </p>
        </div>
      </footer>
    </div>
  );
}
