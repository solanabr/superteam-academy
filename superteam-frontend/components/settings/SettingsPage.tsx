"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  Copy,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Save,
  Sun,
  Moon,
  Monitor,
  Twitter,
  Wallet,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { IdentityProfile } from "@/lib/identity/types";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useSetLocale } from "@/i18n/client";

type SettingsState = {
  name: string;
  bio: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  language: string;
  emailNotifications: boolean;
  profilePublic: boolean;
};

export function SettingsPage({
  profile,
  walletAddress,
}: {
  profile?: IdentityProfile | null;
  walletAddress: string;
}) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");
  const tTheme = useTranslations("theme");
  const setLocale = useSetLocale();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [settings, setSettings] = useState<SettingsState>({
    name: profile?.name ?? "",
    bio: profile?.bio ?? "",
    twitter: "",
    github: "",
    linkedin: "",
    website: "",
    language: "en",
    emailNotifications: true,
    profilePublic: true,
  });

  const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("settingsFailed"));
    } finally {
      setSaving(false);
    }
  };

  const copyWallet = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (value: string) => {
    setSettings((prev) => ({ ...prev, language: value }));
    setLocale(value as Locale);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6 lg:py-10">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("title")}</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("profileSection")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarFallback className="text-lg font-semibold text-primary bg-primary/10">
                  {(settings.name || shortWallet).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {settings.name || shortWallet}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("avatarComingSoon")}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                {t("name")}
              </label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("displayNamePlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="bio"
                className="text-sm font-medium text-foreground"
              >
                {t("bio")}
              </label>
              <Textarea
                id="bio"
                value={settings.bio}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder={t("bioPlaceholder")}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Twitter className="h-3.5 w-3.5" /> {t("twitter")}
                </label>
                <Input
                  value={settings.twitter}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      twitter: e.target.value,
                    }))
                  }
                  placeholder="@username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" /> {t("github")}
                </label>
                <Input
                  value={settings.github}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      github: e.target.value,
                    }))
                  }
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" /> {t("linkedIn")}
                </label>
                <Input
                  value={settings.linkedin}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> {t("website")}
                </label>
                <Input
                  value={settings.website}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("accountSection")}</CardTitle>
            <CardDescription>{t("accountDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("solanaWallet")}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {shortWallet}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  {t("connected")}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyWallet}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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
                  <p className="text-sm font-medium text-foreground">
                    {t("google")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("notConnected")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("linkAccount")}
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <Github className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("github")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("notConnected")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("linkAccount")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("preferencesSection")}</CardTitle>
            <CardDescription>{t("preferencesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("language")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("chooseLanguage")}
                </p>
              </div>
              <Select
                value={settings.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {localeNames[loc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("themePreference")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("selectAppearance")}
                </p>
              </div>
              <div className="flex gap-1 rounded-lg border border-border p-0.5">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-3.5 w-3.5 mr-1.5" /> {tTheme("light")}
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-3.5 w-3.5 mr-1.5" /> {tTheme("dark")}
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="h-3.5 w-3.5 mr-1.5" /> {tTheme("system")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("emailNotifications")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("notificationsDescription")}
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: checked,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("privacySection")}</CardTitle>
            <CardDescription>{t("privacyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("publicProfile")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("publicProfileDescription")}
                </p>
              </div>
              <Switch
                checked={settings.profilePublic}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, profilePublic: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("dataExport")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("exportDescription")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(t("dataExportComingSoon"))}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> {t("export")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> {t("saveChanges")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
