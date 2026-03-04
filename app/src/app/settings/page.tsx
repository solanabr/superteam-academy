"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  User,
  Wallet,
  Settings2,
  Shield,
  Github,
  Twitter,
  Globe,
  Copy,
  Check,
  Lock,
  Unlock,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { userProfile } from "@/data/profile";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { locales, localeNames } from "@/i18n/config";

type Tab = "profile" | "account" | "preferences" | "privacy";

/* ── Toggle Switch ── */

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        enabled ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── Section: Profile ── */

interface ProfileForm {
  name: string;
  username: string;
  bio: string;
  github: string;
  twitter: string;
  website: string;
}

function ProfileSection({
  form,
  setField,
  onSave,
  saved,
  t,
}: {
  form: ProfileForm;
  setField: (k: keyof ProfileForm, v: string) => void;
  onSave: () => void;
  saved: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border border-primary/20">
          {form.name
            ? form.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "?"}
        </div>
        <div>
          <p className="text-sm font-medium">
            {form.name || t("settings.yourName")}
          </p>
          <p className="text-xs text-muted-foreground/60">
            @{form.username || "username"}
          </p>
        </div>
      </div>

      {/* Name */}
      <FieldGroup label={t("settings.displayName")}>
        <input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className="w-full rounded-lg border border-border/40 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/40 transition-colors"
        />
      </FieldGroup>

      {/* Username */}
      <FieldGroup label={t("settings.username")}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50">
            @
          </span>
          <input
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
            className="w-full rounded-lg border border-border/40 bg-transparent pl-7 pr-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/40 transition-colors"
          />
        </div>
      </FieldGroup>

      {/* Bio */}
      <FieldGroup label={t("settings.bio")}>
        <textarea
          value={form.bio}
          onChange={(e) => setField("bio", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border/40 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/40 transition-colors resize-none"
        />
      </FieldGroup>

      {/* Social Links */}
      <FieldGroup label={t("settings.socialLinks")}>
        <div className="space-y-2">
          <SocialInput
            icon={Github}
            value={form.github}
            onChange={(v) => setField("github", v)}
            placeholder="https://github.com/username"
          />
          <SocialInput
            icon={Twitter}
            value={form.twitter}
            onChange={(v) => setField("twitter", v)}
            placeholder="https://twitter.com/username"
          />
          <SocialInput
            icon={Globe}
            value={form.website}
            onChange={(v) => setField("website", v)}
            placeholder="https://yoursite.dev"
          />
        </div>
      </FieldGroup>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSave}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {t("settings.saveChanges")}
        </button>
        {saved && (
          <span className="text-xs text-primary flex items-center gap-1">
            <Check className="size-3" />
            {t("common.saved")}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Section: Account ── */

function AccountSection() {
  const { publicKey } = useWallet();
  const { user, linkGoogle, linkGithub, unlinkProvider } = useAuth();
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const walletAddress = publicKey?.toBase58() ?? "";
  const truncated = walletAddress
    ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4)
    : t("common.notConnected");

  function handleCopy() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Connected Wallet */}
      <FieldGroup label={t("settings.connectedWallet")}>
        <div className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2.5">
          <Wallet className="size-4 text-muted-foreground/60" />
          <span className="text-sm font-mono flex-1">{truncated}</span>
          <button
            onClick={handleCopy}
            className="text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </FieldGroup>

      {/* Email */}
      <FieldGroup
        label={t("settings.email")}
        description={t("settings.emailDescription")}
      >
        <input
          type="email"
          defaultValue={user?.email ?? ""}
          placeholder={t("settings.addEmail")}
          className="w-full rounded-lg border border-border/40 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/40 transition-colors"
        />
      </FieldGroup>

      {/* Connected Accounts */}
      <FieldGroup label={t("settings.connectedAccounts")}>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5">
            <Github className="size-4 text-muted-foreground/60" />
            <span className="text-sm flex-1">GitHub</span>
            {user?.githubId ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t("common.connected")}
                </span>
                <button
                  onClick={() => unlinkProvider("github")}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={linkGithub}
                className="text-[10px] font-medium text-muted-foreground/70 border border-border/40 px-2 py-0.5 rounded-full hover:text-foreground transition-colors"
              >
                {t("common.connect")}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5">
            <svg
              className="size-4 text-muted-foreground/60"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm flex-1">Google</span>
            {user?.googleId ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t("common.connected")}
                </span>
                <button
                  onClick={() => unlinkProvider("google")}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={linkGoogle}
                className="text-[10px] font-medium text-muted-foreground/70 border border-border/40 px-2 py-0.5 rounded-full hover:text-foreground transition-colors"
              >
                {t("common.connect")}
              </button>
            )}
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}

/* ── Section: Preferences ── */

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    achievements: true,
    streakReminders: false,
  });

  const themes = [
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
    { value: "system", label: t("settings.themeSystem") },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <FieldGroup label={t("settings.theme")}>
        <div className="flex gap-0.5 rounded-lg bg-muted/30 p-1 w-fit">
          {themes.map((th) => (
            <button
              key={th.value}
              onClick={() => setTheme(th.value)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === th.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Language */}
      <LanguageSelector />

      {/* Notifications */}
      <FieldGroup label={t("settings.notifications")}>
        <div className="space-y-3">
          <NotificationRow
            icon={Bell}
            title={t("settings.courseUpdates")}
            description={t("settings.courseUpdatesDesc")}
            enabled={notifications.courseUpdates}
            onToggle={() =>
              setNotifications((n) => ({
                ...n,
                courseUpdates: !n.courseUpdates,
              }))
            }
          />
          <NotificationRow
            icon={Bell}
            title={t("settings.achievementAlerts")}
            description={t("settings.achievementAlertsDesc")}
            enabled={notifications.achievements}
            onToggle={() =>
              setNotifications((n) => ({
                ...n,
                achievements: !n.achievements,
              }))
            }
          />
          <NotificationRow
            icon={notifications.streakReminders ? Bell : BellOff}
            title={t("settings.streakReminders")}
            description={t("settings.streakRemindersDesc")}
            enabled={notifications.streakReminders}
            onToggle={() =>
              setNotifications((n) => ({
                ...n,
                streakReminders: !n.streakReminders,
              }))
            }
          />
        </div>
      </FieldGroup>
    </div>
  );
}

/* ── Section: Privacy ── */

function PrivacySection() {
  const { user, updateProfile } = useAuth();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3.5">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Unlock className="size-4 text-primary" />
          ) : (
            <Lock className="size-4 text-muted-foreground/60" />
          )}
          <div>
            <p className="text-sm font-medium">
              {t("settings.profileVisibility")}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {isPublic
                ? t("settings.publicDescription")
                : t("settings.privateDescription")}
            </p>
          </div>
        </div>
        <Toggle
          enabled={isPublic}
          onToggle={() => {
            const next = !isPublic;
            setIsPublic(next);
            updateProfile({ isPublic: next });
          }}
        />
      </div>
    </div>
  );
}

/* ── Shared Components ── */

function FieldGroup({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {description}
        </p>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SocialInput({
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Github;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/40 bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/40 transition-colors"
      />
    </div>
  );
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground/60" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[10px] text-muted-foreground/60">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

/* ── Language Selector ── */

function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  const { updateProfile } = useAuth();

  return (
    <FieldGroup label={t("common.language")}>
      <div className="flex gap-0.5 rounded-lg bg-muted/30 p-1 w-fit">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => {
              setLocale(loc);
              updateProfile({ locale: loc });
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              locale === loc
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    </FieldGroup>
  );
}

/* ── Page ── */

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: t("settings.profileTab"), icon: User },
    { id: "account", label: t("settings.accountTab"), icon: Wallet },
    { id: "preferences", label: t("settings.preferencesTab"), icon: Settings2 },
    { id: "privacy", label: t("settings.privacyTab"), icon: Shield },
  ];

  const initialTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "account" || tab === "preferences" || tab === "privacy"
      ? tab
      : "profile";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [saved, setSaved] = useState(false);
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name: user?.name ?? userProfile.name,
    username: user?.username ?? userProfile.username,
    bio: user?.bio ?? userProfile.bio,
    github: user?.socialLinks?.github ?? userProfile.socialLinks.github ?? "",
    twitter:
      user?.socialLinks?.twitter ?? userProfile.socialLinks.twitter ?? "",
    website:
      user?.socialLinks?.website ?? userProfile.socialLinks.website ?? "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        username: user.username,
        bio: user.bio ?? "",
        github: user.socialLinks?.github ?? "",
        twitter: user.socialLinks?.twitter ?? "",
        website: user.socialLinks?.website ?? "",
      });
    }
  }, [user]);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    updateProfile({
      name: form.name,
      username: form.username,
      bio: form.bio,
      socialLinks: {
        github: form.github,
        twitter: form.twitter,
        website: form.website,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20">
        {/* Header */}
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t("settings.profileTab")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-6">
          {/* Tab Nav — horizontal on mobile, vertical sidebar on desktop */}
          <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-muted/30 text-foreground font-medium"
                    : "text-muted-foreground/70 hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-border/30 p-6">
              {activeTab === "profile" && (
                <ProfileSection
                  form={form}
                  setField={setField}
                  onSave={handleSave}
                  saved={saved}
                  t={t}
                />
              )}
              {activeTab === "account" && <AccountSection />}
              {activeTab === "preferences" && <PreferencesSection />}
              {activeTab === "privacy" && <PrivacySection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  );
}
