"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import { useAppStore } from "@/stores/app-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";
import {
  User,
  Palette,
  Shield,
  Wallet,
  Save,
  Check,
  Camera,
  Loader2,
  Link,
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { user, profile, walletLinked, linkWallet, refreshProfile } = useAuth();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { theme, setTheme } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const pendingLink = useRef(false);

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
      setAvatarUrl(profile.avatarUrl ?? null);
    }
  }, [profile]);

  // Auto-trigger wallet link after wallet connects via modal
  useEffect(() => {
    if (connected && pendingLink.current && !walletLinked) {
      pendingLink.current = false;
      setLinkingWallet(true);
      linkWallet()
        .then(() => toast.success("Wallet linked successfully"))
        .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to link wallet"))
        .finally(() => setLinkingWallet(false));
    }
  }, [connected, walletLinked, linkWallet]);

  const handleLinkWallet = async () => {
    if (!connected) {
      pendingLink.current = true;
      setVisible(true);
      return;
    }

    setLinkingWallet(true);
    try {
      await linkWallet();
      toast.success("Wallet linked successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link wallet");
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setAvatarUrl(data.avatarUrl);
      await refreshProfile();
      toast.success("Avatar updated");
    } catch (err) {
      console.error("[Settings] Avatar upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const userId = profile?.id ?? user?.id;

    if (!userId) {
      toast.error("Could not determine your account. Please sign out and back in.");
      return;
    }

    setSaving(true);

    try {
      // If profile doesn't exist yet, create it server-side first
      if (!profile) {
        const ensureRes = await fetch("/api/auth/ensure-profile", { method: "POST" });
        if (!ensureRes.ok) {
          const body = await ensureRes.json().catch(() => ({}));
          console.error("[Settings] ensure-profile failed:", ensureRes.status, body);
          toast.error("Could not create your profile. Please sign out and back in.");
          return;
        }
      }

      // Update profile via server API (bypasses browser RLS issues)
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          bio,
          socialLinks: { twitter, github, website },
          isPublic,
          preferredLanguage: language,
          theme,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }

      await refreshProfile();
      toast.success(t("saved"));
    } catch (err) {
      console.error("[Settings] Failed to save profile:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save");
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
              {/* Avatar picker */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative group cursor-pointer"
                >
                  <Avatar className="size-20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile picture" />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {(displayName || username || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                </button>
                <div>
                  <p className="text-sm font-medium">Profile Picture</p>
                  <p className="text-xs text-muted-foreground">
                    Click to upload. Max 2 MB. JPEG, PNG, WebP, or GIF.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

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
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Link a Solana wallet to receive XP tokens, credentials, and achievements on-chain.
                </p>
                <Button
                  variant="outline"
                  onClick={handleLinkWallet}
                  disabled={linkingWallet}
                  className="gap-2 h-10"
                >
                  {linkingWallet ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  {linkingWallet ? "Linking..." : t("linkWallet")}
                </Button>
              </div>
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
