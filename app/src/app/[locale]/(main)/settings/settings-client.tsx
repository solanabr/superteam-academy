"use client";

import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Globe,
  Moon,
  Sun,
  Wallet,
  Bell,
  Lock,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, Link } from "@/i18n/navigation";

const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";
const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_BIO_KEY = "st-academy:profile-bio";

const SOCIAL_X_KEY = "st-academy:social:x";
const SOCIAL_LINKEDIN_KEY = "st-academy:social:linkedin";
const SOCIAL_TELEGRAM_KEY = "st-academy:social:telegram";
const SOCIAL_DISCORD_KEY = "st-academy:social:discord";
const SOCIAL_GITHUB_KEY = "st-academy:social:github";

const SETTINGS_EMAIL_NOTIFICATIONS_KEY =
  "st-academy:settings:emailNotifications";
const SETTINGS_STREAK_REMINDERS_KEY = "st-academy:settings:streakReminders";
const SETTINGS_COURSE_UPDATES_KEY = "st-academy:settings:courseUpdates";
const SETTINGS_PROFILE_VISIBILITY_KEY = "st-academy:settings:profileVisibility";

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          checked
            ? "bg-[hsl(var(--brand-logo-green))]"
            : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsClient() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { theme = "dark", setTheme } = useTheme();
  const { publicKey, logout: disconnect, login } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Social links
  const [socialX, setSocialX] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialTelegram, setSocialTelegram] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");
  const [socialGithub, setSocialGithub] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);

  // Privacy preferences
  const [profilePublic, setProfilePublic] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem(PROFILE_NAME_KEY) || "");
    setBio(localStorage.getItem(PROFILE_BIO_KEY) || "");
    setAvatarPreview(localStorage.getItem(PROFILE_AVATAR_KEY));

    // Load social links
    setSocialX(localStorage.getItem(SOCIAL_X_KEY) || "");
    setSocialLinkedin(localStorage.getItem(SOCIAL_LINKEDIN_KEY) || "");
    setSocialTelegram(localStorage.getItem(SOCIAL_TELEGRAM_KEY) || "");
    setSocialDiscord(localStorage.getItem(SOCIAL_DISCORD_KEY) || "");
    setSocialGithub(localStorage.getItem(SOCIAL_GITHUB_KEY) || "");

    // Load notification preferences
    const storedEmail = localStorage.getItem(SETTINGS_EMAIL_NOTIFICATIONS_KEY);
    if (storedEmail !== null) setEmailNotifications(storedEmail === "true");

    const storedStreak = localStorage.getItem(SETTINGS_STREAK_REMINDERS_KEY);
    if (storedStreak !== null) setStreakReminders(storedStreak === "true");

    const storedCourse = localStorage.getItem(SETTINGS_COURSE_UPDATES_KEY);
    if (storedCourse !== null) setCourseUpdates(storedCourse === "true");

    // Load privacy preferences
    const storedVisibility = localStorage.getItem(
      SETTINGS_PROFILE_VISIBILITY_KEY,
    );
    if (storedVisibility !== null)
      setProfilePublic(storedVisibility === "public");
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(PROFILE_AVATAR_KEY, dataUrl);
      setAvatarPreview(dataUrl);
      window.dispatchEvent(
        new CustomEvent("profile-avatar-change", { detail: dataUrl }),
      );
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (v: string) => {
    setName(v);
    localStorage.setItem(PROFILE_NAME_KEY, v);
    window.dispatchEvent(new CustomEvent("profile-name-change"));
  };

  const handleBioChange = (v: string) => {
    setBio(v);
    localStorage.setItem(PROFILE_BIO_KEY, v);
    window.dispatchEvent(new CustomEvent("profile-bio-change"));
  };

  const handleSocialChange = useCallback(
    (key: string, setter: (v: string) => void) => (v: string) => {
      setter(v);
      localStorage.setItem(key, v);
    },
    [],
  );

  const handleToggleEmailNotifications = useCallback((value: boolean) => {
    setEmailNotifications(value);
    localStorage.setItem(SETTINGS_EMAIL_NOTIFICATIONS_KEY, String(value));
  }, []);

  const handleToggleStreakReminders = useCallback((value: boolean) => {
    setStreakReminders(value);
    localStorage.setItem(SETTINGS_STREAK_REMINDERS_KEY, String(value));
  }, []);

  const handleToggleCourseUpdates = useCallback((value: boolean) => {
    setCourseUpdates(value);
    localStorage.setItem(SETTINGS_COURSE_UPDATES_KEY, String(value));
  }, []);

  const handleToggleProfileVisibility = useCallback((value: boolean) => {
    setProfilePublic(value);
    localStorage.setItem(
      SETTINGS_PROFILE_VISIBILITY_KEY,
      value ? "public" : "private",
    );
  }, []);

  const handleExportData = useCallback(() => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("st-academy:")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "st-academy-data-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const inputClass =
    "bg-white text-black placeholder:text-gray-500 border-border";

  return (
    <div className="space-y-6">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("profile")}
          </CardTitle>
          <CardDescription>{t("updateNameAndAvatar")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("avatar")}
            </label>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                    {publicKey
                      ? publicKey.toBase58().charAt(4).toUpperCase()
                      : "?"}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-border bg-white text-black hover:bg-gray-100"
              >
                {t("avatarUpload")}
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("name")}
            </label>
            <Input
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("bio")}</label>
            <textarea
              placeholder={t("bioPlaceholder")}
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              rows={4}
              className={`flex w-full rounded-md border border-border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px] ${inputClass}`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => router.push("/profile")}
              className="gap-2 bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))] hover:text-white transition-transform active:scale-[0.98]"
            >
              {t("saveProfile")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{t("socialLinks")}</CardTitle>
          <CardDescription>{t("connectSocialDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X (Twitter)
            </label>
            <Input
              placeholder="https://x.com/username"
              value={socialX}
              onChange={(e) =>
                handleSocialChange(SOCIAL_X_KEY, setSocialX)(e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </label>
            <Input
              placeholder="https://linkedin.com/in/username"
              value={socialLinkedin}
              onChange={(e) =>
                handleSocialChange(
                  SOCIAL_LINKEDIN_KEY,
                  setSocialLinkedin,
                )(e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </label>
            <Input
              placeholder="https://t.me/username"
              value={socialTelegram}
              onChange={(e) =>
                handleSocialChange(
                  SOCIAL_TELEGRAM_KEY,
                  setSocialTelegram,
                )(e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Discord
            </label>
            <Input
              placeholder="https://discord.gg/invite"
              value={socialDiscord}
              onChange={(e) =>
                handleSocialChange(
                  SOCIAL_DISCORD_KEY,
                  setSocialDiscord,
                )(e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </label>
            <Input
              placeholder="https://github.com/username"
              value={socialGithub}
              onChange={(e) =>
                handleSocialChange(
                  SOCIAL_GITHUB_KEY,
                  setSocialGithub,
                )(e.target.value)
              }
              className={inputClass}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {tCommon("language")} & {tCommon("theme")}
          </CardTitle>
          <CardDescription>{t("preferences")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">{tCommon("language")}:</span>
            {(["pt", "es", "en"] as const).map((loc) => (
              <Button
                key={loc}
                variant={locale === loc ? "default" : "outline"}
                size="sm"
                className="transition-transform active:scale-[0.98]"
                asChild
              >
                <Link href={pathname ?? "/settings"} locale={loc}>
                  {loc === "pt"
                    ? "Português"
                    : loc === "es"
                      ? "Español"
                      : "English"}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{tCommon("theme")}:</span>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              className="transition-transform active:scale-[0.98]"
              onClick={() => setTheme("dark")}
            >
              <Sun className="mr-1 h-4 w-4" />
              {tCommon("light")}
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              className="transition-transform active:scale-[0.98]"
              onClick={() => setTheme("light")}
            >
              <Moon className="mr-1 h-4 w-4" />
              {tCommon("dark")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Wallets */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("connectedWallets")}
          </CardTitle>
          <CardDescription>{t("connectedWalletsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicKey ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-logo-green))]/10">
                  <Wallet className="h-4 w-4 text-[hsl(var(--brand-logo-green))]" />
                </div>
                <span className="truncate font-mono text-sm">
                  {publicKey.toBase58()}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              >
                {tCommon("disconnect")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("noWalletConnected")}
              </p>
              <Button
                type="button"
                onClick={() => login()}
                className="gap-2 bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))] hover:text-white transition-transform active:scale-[0.98]"
              >
                <Wallet className="h-4 w-4" />
                {t("connectWallet")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts (Google / GitHub) */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("connectedAccounts")}
          </CardTitle>
          <CardDescription>{t("connectedAccountsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-border bg-white text-black hover:bg-gray-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("connectGoogle")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-border bg-white text-black hover:bg-gray-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t("connectGitHub")}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications")}
          </CardTitle>
          <CardDescription>{t("notificationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSwitch
            checked={emailNotifications}
            onChange={handleToggleEmailNotifications}
            label={t("emailNotifications")}
          />
          <ToggleSwitch
            checked={streakReminders}
            onChange={handleToggleStreakReminders}
            label={t("streakReminders")}
          />
          <ToggleSwitch
            checked={courseUpdates}
            onChange={handleToggleCourseUpdates}
            label={t("courseUpdates")}
          />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("privacy")}
          </CardTitle>
          <CardDescription>{t("privacyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {profilePublic ? (
                <Eye className="h-4 w-4 text-[hsl(var(--brand-logo-green))]" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {t("profileVisibility")}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profilePublic}
              onClick={() => handleToggleProfileVisibility(!profilePublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                profilePublic
                  ? "bg-[hsl(var(--brand-logo-green))]"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  profilePublic ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              {t("exportDesc")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              className="gap-2 border-border bg-white text-black hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              {t("exportMyData")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
