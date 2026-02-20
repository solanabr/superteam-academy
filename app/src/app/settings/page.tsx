"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import { supabaseProfileService } from "@/services";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  User,
  Globe,
  Palette,
  Shield,
  Wallet,
  Save,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { profile, walletLinked, linkWallet, refreshProfile } = useAuth();
  const { theme, setTheme } = useAppStore();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
      setTwitter(profile.socialLinks?.twitter ?? "");
      setGithub(profile.socialLinks?.github ?? "");
      setWebsite(profile.socialLinks?.website ?? "");
      setIsPublic(profile.isPublic ?? true);
      setLanguage(profile.preferredLanguage ?? "en");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      await supabaseProfileService.updateProfile(profile.id, {
        username,
        displayName,
        bio,
        socialLinks: { twitter, github, website },
        isPublic,
        preferredLanguage: language,
        theme,
      });
      await refreshProfile();
      toast.success(t("saved"));
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">
            {t("title")}
          </h1>

          {/* Profile section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              {t("profile")}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@handle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Preferences */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Palette className="h-5 w-5" />
              {t("preferences")}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("theme")}</p>
                  <p className="text-xs text-muted-foreground">
                    Choose light or dark mode
                  </p>
                </div>
                <Select
                  value={theme}
                  onValueChange={(v) =>
                    setTheme(v as "light" | "dark" | "system")
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("language")}</p>
                  <p className="text-xs text-muted-foreground">
                    Preferred language
                  </p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt-br">Português</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Privacy */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5" />
              {t("privacy")}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("publicProfile")}</p>
                <p className="text-xs text-muted-foreground">
                  Others can see your profile and stats
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </section>

          <Separator className="my-8" />

          {/* Wallets */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Wallet className="h-5 w-5" />
              {t("connectedWallets")}
            </div>

            {walletLinked ? (
              <div className="flex items-center gap-2 rounded-lg border bg-card p-4">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-mono">
                  {profile?.walletAddress?.slice(0, 6)}...
                  {profile?.walletAddress?.slice(-4)}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Linked
                </span>
              </div>
            ) : (
              <Button variant="outline" className="gap-2" onClick={linkWallet}>
                <Wallet className="h-4 w-4" />
                {t("linkWallet")}
              </Button>
            )}
          </section>

          <Separator className="my-8" />

          {/* Save */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 h-11 px-8"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : t("save")}
            </Button>
          </div>
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
