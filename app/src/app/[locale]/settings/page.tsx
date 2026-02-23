"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { useUser } from "@/lib/hooks/use-user";
import {
  Github,
  Chrome,
  Wallet,
  AlertTriangle,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const params = useParams();
  const locale = params.locale as string;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: session } = useSession();
  const { user, connected } = useUser();
  const { theme, setTheme } = useTheme();

  const linkedAccounts = (session as any)?.linkedAccounts ?? {};

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: {
        displayName: user?.displayName,
        wallet: user?.wallet,
        joinedAt: user?.joinedAt,
      },
      stats: {
        xp: user?.xp,
        level: user?.level,
        currentStreak: user?.streak?.currentStreak,
        longestStreak: user?.streak?.longestStreak,
      },
      achievements: user?.achievements,
      credentials: user?.credentials,
      skills: user?.skills,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superteam-academy-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "profile", label: t("profileInfo") },
    { id: "appearance", label: t("appearance") },
    { id: "accounts", label: t("linkedAccounts") },
    { id: "notifications", label: t("notifications") },
    { id: "privacy", label: t("privacy", { defaultMessage: "Privacy" }) },
    { id: "danger", label: t("dangerZone", { defaultMessage: "Danger Zone" }) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold text-[var(--c-text)]">
        {t("title")}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* Sidebar Nav */}
        <nav
          aria-label="Settings sections"
          className="hidden lg:flex lg:flex-col gap-1"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-[var(--c-bg-card)] text-[var(--c-text)]"
                  : "text-[var(--c-text-2)] hover:text-[var(--c-text-em)] hover:bg-[var(--c-bg-card)]/50"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Form Area */}
        <div className="flex flex-col gap-8 max-w-2xl">
          {/* Profile Section */}
          <section id="profile">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("profileInfo")}
            </h2>
            <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-xl p-6 space-y-4">
              <div>
                <label
                  htmlFor="settings-display-name"
                  className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
                >
                  {t("displayName")}
                </label>
                <Input
                  id="settings-display-name"
                  defaultValue=""
                  placeholder={t("displayNamePlaceholder", {
                    defaultMessage: "Your display name",
                  })}
                />
              </div>
              <div>
                <label
                  htmlFor="settings-bio"
                  className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
                >
                  {t("bio")}
                </label>
                <textarea
                  id="settings-bio"
                  className="flex min-h-[80px] w-full rounded-sm bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-none"
                  defaultValue=""
                  placeholder={t("bioPlaceholder", {
                    defaultMessage: "Tell others about yourself",
                  })}
                />
              </div>
              <Button size="sm" onClick={handleSave}>
                {saved
                  ? t("saved", { defaultMessage: "Saved" })
                  : t("saveChanges")}
              </Button>
            </div>
          </section>

          {/* Appearance Section */}
          <section id="appearance">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("appearance")}
            </h2>
            <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-xl p-6 space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--c-text-em)]">
                  {t("theme")}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "dark", icon: Moon, label: t("dark") },
                    {
                      value: "light",
                      icon: Sun,
                      label: t("light", { defaultMessage: "Light" }),
                    },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex items-center gap-2 rounded border px-4 py-3 text-sm transition-colors cursor-pointer ${
                        mounted && theme === value
                          ? "border-[#55E9AB] bg-[#55E9AB]/10 text-[#55E9AB]"
                          : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text-em)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--c-border-subtle)] pt-6">
                <label className="mb-3 block text-sm font-medium text-[var(--c-text-em)]">
                  {t("language")}
                </label>
                <div className="flex gap-3">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}/settings`}
                      className={`rounded border px-4 py-3 text-sm transition-colors ${
                        locale === loc
                          ? "border-[#55E9AB] bg-[#55E9AB]/10 text-[#55E9AB]"
                          : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text-em)]"
                      }`}
                    >
                      {localeLabels[loc as Locale]}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Linked Accounts Section */}
          <section id="accounts">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("linkedAccounts")}
            </h2>
            <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-xl p-6 space-y-3">
              {[
                {
                  provider: "Google",
                  providerId: "google",
                  icon: Chrome,
                  isConnected: !!linkedAccounts.google,
                  detail: linkedAccounts.google?.email ?? null,
                },
                {
                  provider: "GitHub",
                  providerId: "github",
                  icon: Github,
                  isConnected: !!linkedAccounts.github,
                  detail: linkedAccounts.github?.name ?? null,
                },
                {
                  provider: "Wallet",
                  providerId: "solana-wallet",
                  icon: Wallet,
                  isConnected: connected,
                  detail: connected
                    ? t("walletConnected", {
                        defaultMessage: "Solana wallet connected",
                      })
                    : null,
                },
              ].map(
                ({ provider, providerId, icon: Icon, isConnected, detail }) => (
                  <div
                    key={provider}
                    className="flex items-center justify-between rounded border border-[var(--c-border-subtle)] p-4 hover:border-[var(--c-border-prominent)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[var(--c-text-2)]" />
                      <div>
                        <span className="text-sm font-medium text-[var(--c-text)]">
                          {provider}
                        </span>
                        {isConnected && detail && (
                          <p className="text-xs text-[var(--c-text-2)]">
                            {detail}
                          </p>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="text-xs font-medium text-[#55E9AB] px-2 py-1 rounded bg-[#55E9AB]/10">
                        {t("connected", { defaultMessage: "Connected" })}
                      </span>
                    ) : providerId !== "solana-wallet" ? (
                      <Button size="sm" onClick={() => signIn(providerId)}>
                        {t("connect", { defaultMessage: "Connect" })}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {t("useNavbar", { defaultMessage: "Use navbar" })}
                      </Button>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("notifications")}
            </h2>
            <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-xl p-6 space-y-4">
              {[
                {
                  label: t("emailNotifications"),
                  description: t("emailNotificationsDesc", {
                    defaultMessage: "Receive course updates and announcements",
                  }),
                  enabled: emailNotifications,
                  toggle: () => setEmailNotifications((v) => !v),
                },
                {
                  label: t("streakReminders"),
                  description: t("streakRemindersDesc", {
                    defaultMessage: "Daily reminders to maintain your streak",
                  }),
                  enabled: streakReminders,
                  toggle: () => setStreakReminders((v) => !v),
                },
              ].map(({ label, description, enabled, toggle }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <div>
                    <span
                      id={`switch-label-${label.replace(/\s+/g, "-").toLowerCase()}`}
                      className="text-sm font-medium text-[var(--c-text)]"
                    >
                      {label}
                    </span>
                    <p className="text-xs text-[var(--c-text-2)] mt-0.5">
                      {description}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    aria-labelledby={`switch-label-${label.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={toggle}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4 ${
                      enabled ? "bg-[#55E9AB]" : "bg-[var(--c-border-subtle)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-out ${
                        enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy */}
          <section id="privacy">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("privacy", { defaultMessage: "Privacy" })}
            </h2>
            <div className="rounded-xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--c-text)]">
                      {t("publicProfile", { defaultMessage: "Public Profile" })}
                    </p>
                    <p className="text-xs text-[var(--c-text-2)]">
                      {t("publicProfileDesc", {
                        defaultMessage:
                          "Allow others to view your profile, skills, and achievements",
                      })}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={isPublic}
                    aria-label={t("publicProfile", {
                      defaultMessage: "Public Profile",
                    })}
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${isPublic ? "bg-[#55E9AB]" : "bg-[var(--c-border-subtle)]"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--c-text)]">
                      {t("showOnLeaderboard", {
                        defaultMessage: "Show on Leaderboard",
                      })}
                    </p>
                    <p className="text-xs text-[var(--c-text-2)]">
                      {t("showOnLeaderboardDesc", {
                        defaultMessage:
                          "Display your name and rank on the public leaderboard",
                      })}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={showOnLeaderboard}
                    aria-label={t("showOnLeaderboard", {
                      defaultMessage: "Show on Leaderboard",
                    })}
                    onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${showOnLeaderboard ? "bg-[#55E9AB]" : "bg-[var(--c-border-subtle)]"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${showOnLeaderboard ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--c-border-subtle)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--c-text)]">
                      {t("exportData", { defaultMessage: "Export Your Data" })}
                    </p>
                    <p className="text-xs text-[var(--c-text-2)]">
                      {t("exportDataDesc", {
                        defaultMessage:
                          "Download all your profile data, achievements, and credentials as JSON",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4" />{" "}
                    {t("export", { defaultMessage: "Export" })}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="danger">
            <h2 className="text-sm font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-4">
              {t("dangerZone", { defaultMessage: "Danger Zone" })}
            </h2>
            <div className="border border-[#EF4444]/20 bg-[#EF4444]/5 p-6 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--c-text)]">
                    {t("deleteAccount", { defaultMessage: "Delete Account" })}
                  </p>
                  <p className="text-xs text-[var(--c-text-2)] mt-1">
                    {t("deleteAccountDesc", {
                      defaultMessage:
                        "Permanently remove your account and all associated data. This action cannot be undone. Your on-chain credentials will remain on Solana.",
                    })}
                  </p>
                </div>
              </div>
              <Button
                className="bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/20"
                size="sm"
              >
                {t("deleteAccount", { defaultMessage: "Delete Account" })}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
