"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession, signIn } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { localeOptions } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/routing";
import { trackEvent } from "@/components/analytics/GoogleAnalytics";
import {
  clearLocalCourseIdOverrides,
  parseCourseIdOverridesJson,
  readLocalCourseIdOverrides,
  writeLocalCourseIdOverrides,
} from "@/lib/progress/client-course-id-overrides";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  User,
  Wallet,
  Globe,
  Sun,
  Moon,
  Monitor,
  Download,
  Link2,
  Check,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";
import bs58 from "bs58";
import { toast } from "sonner";

interface SettingsData {
  username: string;
  displayName: string;
  bio: string;
  linkedProviders: string[];
  linkedWallets: string[];
  preferredLocale: string;
  theme: string;
  isPublic: boolean;
  socialLinks: {
    twitter: string | null;
    github: string | null;
    discord: string | null;
    website: string | null;
  };
}

const NOTIFICATION_SETTINGS_STORAGE_KEY = "superteam.settings.notifications";

function SettingsContent() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: session } = useSession();
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { theme: currentTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isSavingCourseIds, setIsSavingCourseIds] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<Locale>(locale as Locale);
  const [selectedTheme, setSelectedTheme] = useState("system");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productNotifications, setProductNotifications] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [courseIdOverridesText, setCourseIdOverridesText] = useState("{}");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = (await response.json()) as SettingsData;
          setSettings(data);
          setUsername(data.username ?? "");
          setDisplayName(data.displayName ?? "");
          setBio(data.bio ?? "");
          setTwitterHandle(data.socialLinks?.twitter ?? "");
          setGithubHandle(data.socialLinks?.github ?? "");
          setDiscordHandle(data.socialLinks?.discord ?? "");
          setWebsite(data.socialLinks?.website ?? "");
          setPreferredLocale((data.preferredLocale as Locale) ?? (locale as Locale));
          setSelectedTheme(data.theme ?? "system");
          setIsPublic(data.isPublic ?? true);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    void fetchSettings();

    const localOverrides = readLocalCourseIdOverrides();
    setCourseIdOverridesText(JSON.stringify(localOverrides, null, 2));

    try {
      const savedNotifications = window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications) as {
          emailNotifications?: boolean;
          productNotifications?: boolean;
        };
        setEmailNotifications(parsed.emailNotifications ?? true);
        setProductNotifications(parsed.productNotifications ?? true);
      }
    } catch {
      // ignore local preference parse failures
    }
  }, [locale]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          bio,
          isPublic,
          twitterHandle,
          githubHandle,
          discordHandle,
          websiteUrl: website,
          preferredLocale,
          theme: selectedTheme || currentTheme || "system",
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      window.localStorage.setItem(
        NOTIFICATION_SETTINGS_STORAGE_KEY,
        JSON.stringify({ emailNotifications, productNotifications })
      );

      setSaveMessage(t("saved"));
      toast.success(t("saved"));
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      toast.error("Failed to save settings", { description: message });
    } finally {
      setIsSaving(false);
    }
  }, [
    username,
    displayName,
    bio,
    isPublic,
    twitterHandle,
    githubHandle,
    discordHandle,
    website,
    preferredLocale,
    selectedTheme,
    currentTheme,
    emailNotifications,
    productNotifications,
    t,
  ]);

  const handleLinkWallet = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) return;
    if (!session?.user?.id) {
      setError("Not authenticated");
      return;
    }

    setIsLinkingWallet(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      if (!nonceResponse.ok) {
        throw new Error("Failed to get wallet link nonce");
      }
      const noncePayload = (await nonceResponse.json()) as { nonce: string };

      // Construct the message for linking
      const message = `Link wallet to Superteam Academy: ${session.user.id}:${noncePayload.nonce}`;

      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureB58 = bs58.encode(signature);

      // Link wallet via the new endpoint
      const linkResponse = await fetch("/api/auth/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          signature: signatureB58,
          message: message,
        }),
      });

      if (!linkResponse.ok) {
        const data = (await linkResponse.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to link wallet");
      }

      // Refresh settings
      const refreshResponse = await fetch("/api/profile");
      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as SettingsData;
        setSettings(data);
      }

      setSaveMessage(t("saved"));
      toast.success(t("saved"));
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to link wallet";
      setError(message);
      toast.error("Failed to link wallet", { description: message });
    } finally {
      setIsLinkingWallet(false);
    }
  }, [connected, publicKey, session?.user?.id, signMessage, t]);

  const handleUnlinkWallet = useCallback(async () => {
    setIsLinkingWallet(true);
    setError(null);
    let disconnectMessage: string | null = null;

    try {
      if (connected) {
        try {
          await disconnect();
        } catch (err) {
          disconnectMessage =
            err instanceof Error ? err.message : "Wallet disconnect failed";
        }
      }

      const response = await fetch("/api/auth/link-wallet", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to unlink wallet");
      }

      // Refresh settings
      const refreshResponse = await fetch("/api/profile");
      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as SettingsData;
        setSettings(data);
      }

      setSaveMessage("Wallet disconnected and unlinked");
      toast.success("Wallet disconnected and unlinked");
      if (disconnectMessage) {
        toast.error("Wallet adapter disconnect warning", {
          description: disconnectMessage,
        });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlink wallet";
      setError(message);
      toast.error("Failed to unlink wallet", { description: message });
    } finally {
      setIsLinkingWallet(false);
    }
  }, [connected, disconnect]);

  const handleExportData = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/export");
      if (!response.ok) throw new Error("Export failed");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "superteam-academy-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
      toast.error("Failed to export data", { description: message });
    }
  }, []);

  const handleSaveCourseIds = useCallback(() => {
    setIsSavingCourseIds(true);
    setError(null);

    try {
      JSON.parse(courseIdOverridesText);
      const parsed = parseCourseIdOverridesJson(courseIdOverridesText);
      writeLocalCourseIdOverrides(parsed);
      toast.success("Saved local course ID overrides");
      setSaveMessage("Saved local course ID overrides");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save local course ids";
      setError(message);
      toast.error("Failed to save local course IDs", { description: message });
    } finally {
      setIsSavingCourseIds(false);
    }
  }, [courseIdOverridesText]);

  const handleClearCourseIds = useCallback(() => {
    clearLocalCourseIdOverrides();
    setCourseIdOverridesText("{}");
    toast.success("Cleared local course ID overrides");
    setSaveMessage("Cleared local course ID overrides");
    setTimeout(() => setSaveMessage(null), 3000);
  }, []);

  const handleOAuthLink = useCallback((provider: "google" | "github") => {
    trackEvent("link_account", "auth", provider);
    void signIn(provider, { callbackUrl: "/settings" });
  }, []);

  const switchLocale = useCallback(
    (locale: Locale) => {
      // Track language switch
      trackEvent("language_switch", "i18n", locale);
      setPreferredLocale(locale);
      router.replace(pathname, { locale });
    },
    [pathname, router]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="academy-fade-up container max-w-4xl py-8 md:py-10">
      <GlassCard className="mb-8 p-6 md:p-8" glowColor="purple">
        <LuxuryBadge color="purple">{t("title")}</LuxuryBadge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
      </GlassCard>

      {/* Status Messages */}
      {saveMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <Check className="h-4 w-4 text-emerald-300" />
          <span className="text-sm text-emerald-200">{saveMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-300" />
          <span className="text-sm text-red-200">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              {t("profileSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">{t("username")}</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("usernamePlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">{t("displayName")}</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("displayNamePlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">{t("bio")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t("bioPlaceholder")}
                maxLength={280}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {tc("save")}
            </Button>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              {t("connectedAccounts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50">G</div>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-muted-foreground">
                    {settings?.linkedProviders.includes("google") ? t("linked") : t("notLinked")}
                  </p>
                </div>
              </div>
              {settings?.linkedProviders.includes("google") ? (
                <Badge variant="success">{t("linked")}</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOAuthLink("google")}
                >
                  {t("linkGoogle")}
                </Button>
              )}
            </div>

            <Separator />

            {/* GitHub */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50">GH</div>
                <div>
                  <p className="text-sm font-medium">GitHub</p>
                  <p className="text-xs text-muted-foreground">
                    {settings?.linkedProviders.includes("github") ? t("linked") : t("notLinked")}
                  </p>
                </div>
              </div>
              {settings?.linkedProviders.includes("github") ? (
                <Badge variant="success">{t("linked")}</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOAuthLink("github")}
                >
                  {t("linkGitHub")}
                </Button>
              )}
            </div>

            <Separator />

            {/* Wallets */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("solanaWallet")}</p>
                    <p className="text-xs text-muted-foreground">
                      {settings?.linkedWallets && settings.linkedWallets.length > 0
                        ? `${settings.linkedWallets[0].slice(0, 6)}...${settings.linkedWallets[0].slice(-4)}`
                        : t("walletLinkDesc")}
                    </p>
                  </div>
                </div>
                {settings?.linkedWallets && settings.linkedWallets.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkWallet}
                    disabled={isLinkingWallet}
                  >
                    {isLinkingWallet ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Disconnect & Unlink
                  </Button>
                ) : connected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLinkWallet}
                    disabled={isLinkingWallet}
                  >
                    {isLinkingWallet ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    {t("linkWallet")}
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setVisible(true)}>
                    {tc("connectWallet")}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              {t("preferencesSection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">{t("language")}</label>
              <div className="flex flex-wrap gap-2">
                {localeOptions.map((loc) => (
                  <Button
                    key={loc.code}
                    variant="ghost"
                    size="sm"
                    onClick={() => switchLocale(loc.code)}
                  >
                    {loc.flag} {loc.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Theme */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">{t("theme")}</label>
              <div className="flex gap-2">
                {[
                  { value: "dark", label: t("themeDark"), icon: Moon },
                  { value: "light", label: t("themeLight"), icon: Sun },
                  { value: "system", label: t("themeSystem"), icon: Monitor },
                ].map((th) => (
                  <Button
                    key={th.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTheme(th.value);
                      setSelectedTheme(th.value);
                    }}
                    className={
                      (selectedTheme || currentTheme) === th.value
                        ? "gap-1 border border-primary bg-primary/10 text-primary"
                        : "gap-1"
                    }
                  >
                    <th.icon className="h-3.5 w-3.5" />
                    {th.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              {t("socialLinks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Twitter / X</label>
              <Input value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="@superteambr" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">GitHub</label>
              <Input value={githubHandle} onChange={(e) => setGithubHandle(e.target.value)} placeholder="solanabr" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Discord</label>
              <Input value={discordHandle} onChange={(e) => setDiscordHandle(e.target.value)} placeholder="superteambrasil" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Website</label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://superteam.fun" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              {t("privacySection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("profileVisibility")}</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? t("publicDesc") : t("privateDesc")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPublic(!isPublic)}
              >
                {isPublic ? t("publicProfile") : t("privateProfile")}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("exportData")}</p>
                <p className="text-xs text-muted-foreground">{t("exportDesc")}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleExportData} className="gap-1">
                <Download className="h-3.5 w-3.5" />
                {t("exportData")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              {t("notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("emailNotifications")}</p>
                <p className="text-xs text-muted-foreground">
                  Receive course completions, credential updates, and cohort announcements by email.
                </p>
              </div>
              <Button
                type="button"
                variant={emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => setEmailNotifications((value) => !value)}
              >
                {emailNotifications ? t("on") : t("off")}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Product notifications</p>
                <p className="text-xs text-muted-foreground">
                  Keep in-app release notes and leaderboard/streak reminders enabled on this device.
                </p>
              </div>
              <Button
                type="button"
                variant={productNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => setProductNotifications((value) => !value)}
              >
                {productNotifications ? t("on") : t("off")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Course ID Overrides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Local on-chain course ID map</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This is browser-local and applies immediately to direct enrollment transactions.
                Use it to override {`slug -> courseId`} mappings without redeploying. Global env
                overrides still apply separately on the server.
              </p>
            </div>
            <textarea
              value={courseIdOverridesText}
              onChange={(e) => setCourseIdOverridesText(e.target.value)}
              className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveCourseIds} disabled={isSavingCourseIds}>
                {isSavingCourseIds ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Local Overrides
              </Button>
              <Button variant="ghost" onClick={handleClearCourseIds}>
                Clear Local Overrides
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Example entry: {`{ "solana-fundamentals": "anchor-101" }`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
