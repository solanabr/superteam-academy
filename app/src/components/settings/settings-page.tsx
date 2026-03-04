"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTheme } from "next-themes";
import {
  User,
  Wallet,
  Bell,
  Globe,
  Moon,
  Sun,
  Monitor,
  Shield,
  Download,
  Trash2,
  Link2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { truncateAddress } from "@/lib/utils";

export function SettingsPage() {
  const t = useTranslations("settings");
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <User className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect your wallet to access your settings.
        </p>
        <Button size="lg" onClick={() => setVisible(true)}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t("sections.profile")}</TabsTrigger>
          <TabsTrigger value="account">{t("sections.account")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("sections.preferences")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("sections.privacy")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings walletAddress={publicKey?.toBase58() || ""} />
        </TabsContent>

        <TabsContent value="account">
          <AccountSettings
            walletAddress={publicKey?.toBase58() || ""}
            onDisconnect={disconnect}
          />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSettings({ walletAddress }: { walletAddress: string }) {
  const t = useTranslations("settings.profile");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In production: save to API/blockchain
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("name")}
        </CardTitle>
        <CardDescription>
          Your public profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl">
              {walletAddress.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or GIF. Max 2MB
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("name")}</label>
          <Input
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("username")}</label>
          <Input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            academy.superteam.fun/u/{username || "username"}
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("bio")}</label>
          <textarea
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountSettings({
  walletAddress,
  onDisconnect,
}: {
  walletAddress: string;
  onDisconnect: () => void;
}) {
  const t = useTranslations("settings.account");

  return (
    <div className="space-y-6">
      {/* Connected Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("wallets")}
          </CardTitle>
          <CardDescription>
            Manage your connected wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{truncateAddress(walletAddress, 8)}</p>
                <p className="text-xs text-muted-foreground">Primary wallet</p>
              </div>
            </div>
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect external accounts for additional sign-in options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              </div>
              <div>
                <p className="font-medium text-sm">{t("google")}</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t("link")}
            </Button>
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-500/10 p-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">{t("github")}</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t("link")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesSettings() {
  const t = useTranslations("settings.preferences");
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t("theme")}
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`p-4 rounded-lg border text-center transition-colors ${
                theme === "light" ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}
            >
              <Sun className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">{t("light")}</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-lg border text-center transition-colors ${
                theme === "dark" ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}
            >
              <Moon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">{t("dark")}</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`p-4 rounded-lg border text-center transition-colors ${
                theme === "system" ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}
            >
              <Monitor className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">{t("system")}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("language")}
          </CardTitle>
          <CardDescription>
            Select your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications")}
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Course Updates</p>
                <p className="text-xs text-muted-foreground">
                  Get notified about new lessons and content
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Streak Reminders</p>
                <p className="text-xs text-muted-foreground">
                  Daily reminders to maintain your streak
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Achievement Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when you unlock achievements
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacySettings() {
  const t = useTranslations("settings.privacy");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("profileVisibility")}
          </CardTitle>
          <CardDescription>
            Control who can see your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Public Profile</p>
              <p className="text-xs text-muted-foreground">
                Allow others to view your profile
              </p>
            </div>
            <input
              type="checkbox"
              checked={profilePublic}
              onChange={(e) => setProfilePublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t("showOnLeaderboard")}</p>
              <p className="text-xs text-muted-foreground">
                Display your rank on the public leaderboard
              </p>
            </div>
            <input
              type="checkbox"
              checked={showOnLeaderboard}
              onChange={(e) => setShowOnLeaderboard(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t("exportData")}</p>
                <p className="text-xs text-muted-foreground">
                  Download all your data
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-sm text-destructive">
                  {t("deleteAccount")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
