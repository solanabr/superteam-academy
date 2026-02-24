"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { signIn, useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { useRouter } from "@/i18n/routing";
import { useProfileMutation, useUsernameCheck } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resizeImage } from "@/lib/utils/resize-image";
import { AVATAR_MAX_SIZE, AVATAR_ALLOWED_TYPES } from "@/lib/validations/profile";
import type { UserProfile } from "@/types/user";
import {
  User,
  Shield,
  Settings2,
  Eye,
  Github,
  Wallet,
  Globe,
  Download,
  Check,
  X,
  Loader2,
  Mail,
  Camera,
} from "lucide-react";

interface SettingsFormProps {
  initialProfile: UserProfile;
  linkedAccounts: string[];
  walletAddress?: string;
}

export default function SettingsForm({
  initialProfile,
  linkedAccounts,
  walletAddress,
}: SettingsFormProps) {
  const t = useTranslations("settings");
  const { data: session, update: updateSession } = useSession();
  const tc = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { updateProfile, updating } = useProfileMutation();

  // If an OAuth provider (Google/GitHub) was already linked to a different profile,
  // the session silently switches to that profile after the redirect. Show a one-shot
  // notification and then clear the flag from the JWT.
  const shownSwitchNotification = useRef(false);
  useEffect(() => {
    if (session?.switchedProfileName && !shownSwitchNotification.current) {
      shownSwitchNotification.current = true;
      toast.info(
        `You are now signed in as "${session.switchedProfileName}" because this account was already linked to that profile.`,
      );
      updateSession({});
    }
  }, [session, updateSession]);

  // Profile tab state
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [username, setUsername] = useState(initialProfile.username);
  const [bio, setBio] = useState(initialProfile.bio);
  const [website, setWebsite] = useState(
    initialProfile.socialLinks?.website ?? "",
  );

  // Privacy tab state
  const [isPublic, setIsPublic] = useState(initialProfile.isPublic);

  // Preferences tab state
  const [emailNotifications, setEmailNotifications] = useState(
    initialProfile.emailNotifications,
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Username check
  const { available: usernameAvailable, checking: usernameChecking } =
    useUsernameCheck(username, initialProfile.username);

  const githubUsername = initialProfile.socialLinks?.github ?? "";

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
      toast.error(t("avatarTooLarge"));
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error(t("avatarTooLarge"));
      return;
    }

    setUploadingAvatar(true);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resized);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error(t("saveError"));
        return;
      }

      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
      // Refresh the NextAuth JWT so the header avatar updates immediately
      await updateSession({});
      toast.success(t("avatarUpdated"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    const result = await updateProfile({
      displayName,
      username,
      bio,
      socialLinks: { github: githubUsername, website },
    });
    if (result) {
      // Refresh the NextAuth JWT so the header name updates immediately
      await updateSession({});
      toast.success(t("profileSaved"));
    } else {
      toast.error(t("saveError"));
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferredTheme: theme,
        emailNotifications,
      }),
    });
    setSavingPrefs(false);
    if (res.ok) {
      toast.success(t("preferencesSaved"));
    } else {
      toast.error(t("saveError"));
    }
  };

  const handleTogglePrivacy = async (value: boolean) => {
    setIsPublic(value);
    const res = await fetch("/api/profile/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: value }),
    });
    if (res.ok) {
      toast.success(t("privacySaved"));
    } else {
      toast.error(t("saveError"));
      setIsPublic(!value);
    }
  };

  const handleExportData = async () => {
    toast.info(t("exportStarted"));
    const res = await fetch("/api/profile/export");
    if (!res.ok) {
      toast.error(t("saveError"));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superteam-academy-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLanguageChange = async (lang: string) => {
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage: lang }),
    });
    if (res.ok) {
      router.replace("/settings", { locale: lang as "en" | "pt-BR" | "es" });
    }
  };

  const handleConnectGithub = async () => {
    await fetch("/api/auth/link-intent", { method: "POST" });
    signIn("github", { callbackUrl: window.location.href });
  };

  const handleConnectGoogle = async () => {
    await fetch("/api/auth/link-intent", { method: "POST" });
    signIn("google", { callbackUrl: window.location.href });
  };

  // Wallet connect — delegates to shared hook (same flow as course enrollment page)
  const { linkWallet: handleConnectWallet, linking: connectingWallet } = useWalletLink(
    () => router.refresh(),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("profileTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("accountTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("preferencesTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{t("privacyTab")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("profileTab")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar upload */}
              <div className="space-y-2">
                <Label>{t("avatar")}</Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="group relative cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="text-lg">
                        {displayName?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {uploadingAvatar ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </span>
                  </button>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("uploadingAvatar")}
                        </>
                      ) : (
                        t("changeAvatar")
                      )}
                    </Button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("displayName")}</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("username")}</Label>
                <div className="relative">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                  />
                  {username !== initialProfile.username &&
                    username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameChecking ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : usernameAvailable ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                </div>
                {username !== initialProfile.username &&
                  username.length >= 3 &&
                  !usernameChecking && (
                    <p
                      className={`text-xs ${usernameAvailable ? "text-green-500" : "text-red-500"}`}
                    >
                      {usernameAvailable
                        ? t("usernameAvailable")
                        : t("usernameTaken")}
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label>
                  {t("bio")}{" "}
                  <span className="text-muted-foreground">
                    ({bio.length}/280)
                  </span>
                </Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={280}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("socialLinks")}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      value={githubUsername}
                      readOnly
                      disabled
                      placeholder={t("connectGithubHint")}
                      className="opacity-70"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      placeholder={t("websitePlaceholder")}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updating ? t("saving") : tc("save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("connectedAccounts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {initialProfile.email && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">{t("email")}</p>
                      <p className="text-xs text-muted-foreground">
                        {initialProfile.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{t("connected")}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">GitHub</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedAccounts.includes("github")
                        ? githubUsername || t("connected")
                        : t("notConnected")}
                    </p>
                  </div>
                </div>
                {linkedAccounts.includes("github") ? (
                  <Badge variant="secondary">{t("connected")}</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGithub}
                  >
                    {t("connect")}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedAccounts.includes("google")
                        ? t("connected")
                        : t("notConnected")}
                    </p>
                  </div>
                </div>
                {linkedAccounts.includes("google") ? (
                  <Badge variant="secondary">{t("connected")}</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGoogle}
                  >
                    {t("connect")}
                  </Button>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Solana Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      {walletAddress ?? t("notConnected")}
                    </p>
                  </div>
                </div>
                {walletAddress ? (
                  <Badge variant="secondary">{t("connected")}</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectWallet}
                    disabled={connectingWallet}
                  >
                    {connectingWallet && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {connectingWallet ? t("saving") : t("connectWallet")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("preferencesTab")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">{t("theme")}</Label>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {(["dark", "light", "brasil"] as const).map((t_val) => (
                    <button
                      key={t_val}
                      onClick={() => setTheme(t_val)}
                      className={`rounded-lg border p-4 text-center text-sm transition-all ${theme === t_val
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                        }`}
                    >
                      {t_val === "dark"
                        ? t("themeDark")
                        : t_val === "light"
                          ? t("themeLight")
                          : t("themeBrasil")}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base">{t("language")}</Label>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {(
                    [
                      ["en", "languageEn"],
                      ["pt-BR", "languagePtBR"],
                      ["es", "languageEs"],
                    ] as const
                  ).map(([code, key]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`rounded-lg border p-4 text-center text-sm transition-all ${initialProfile.preferredLanguage === code
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                        }`}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("emailNotifications")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications")}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Button onClick={handleSavePreferences} disabled={savingPrefs}>
                {savingPrefs && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {savingPrefs ? t("saving") : tc("save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>{t("privacyTab")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("profileVisibility")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? t("publicDescription")
                      : t("privateDescription")}
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={handleTogglePrivacy}
                />
              </div>
              <Separator />
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4" />
                {t("exportData")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
