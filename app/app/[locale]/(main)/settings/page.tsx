"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getPreference, setPreference } from "@/lib/preferences";
import { trackEvent } from "@/lib/analytics";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import * as Switch from "@radix-ui/react-switch";

function SettingsSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-solana-green" : "bg-edge"
      }`}
    >
      <Switch.Thumb
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </Switch.Root>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  useEffect(() => {
    setMounted(true);
    setNotifications(getPreference("notifications", false));
    setShowOnLeaderboard(getPreference("showOnLeaderboard", true));
    setPublicProfile(getPreference("publicProfile", true));
  }, []);

  const currentLocale = routing.locales.find((l) =>
    pathname.startsWith(`/${l}`)
  ) ?? routing.defaultLocale;

  const switchLocale = (locale: Locale) => {
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as Locale)) {
      segments[1] = locale;
    } else {
      segments.splice(1, 0, locale);
    }
    router.push(segments.join("/") || "/");
  };

  const themes = [
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
    { value: "system", label: t("themeSystem") },
  ] as const;

  const localeLabels: Record<string, string> = {
    en: "English",
    "pt-BR": "Português",
    es: "Español",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-content">{t("title")}</h1>

      <div className="space-y-8">
        {/* Theme */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">
            {t("theme")}
          </h2>
          <div className="flex gap-2">
            {themes.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); trackEvent("theme_changed", { theme: opt.value }); }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  mounted && theme === opt.value
                    ? "border-solana-purple bg-solana-purple/10 text-solana-purple"
                    : "border-edge text-content-secondary hover:text-content"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">
            {t("languageTitle")}
          </h2>
          <div className="flex gap-2">
            {routing.locales.map((locale) => (
              <button
                key={locale}
                onClick={() => { switchLocale(locale); trackEvent("language_changed", { locale }); }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  currentLocale === locale
                    ? "border-solana-purple bg-solana-purple/10 text-solana-purple"
                    : "border-edge text-content-secondary hover:text-content"
                }`}
              >
                {localeLabels[locale]}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">
            {t("notifications")}
          </h2>
          <div className="flex items-center justify-between rounded-xl border border-edge bg-card p-4">
            <div>
              <p className="text-sm font-medium text-content">{t("notifications")}</p>
              <p className="text-xs text-content-muted">{t("notificationsDesc")}</p>
            </div>
            <SettingsSwitch
              checked={notifications}
              onCheckedChange={(v) => { setNotifications(v); setPreference("notifications", v); }}
            />
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">
            {t("privacy")}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-edge bg-card p-4">
              <div>
                <p className="text-sm font-medium text-content">{t("showOnLeaderboard")}</p>
                <p className="text-xs text-content-muted">{t("showOnLeaderboardDesc")}</p>
              </div>
              <SettingsSwitch
                checked={showOnLeaderboard}
                onCheckedChange={(v) => { setShowOnLeaderboard(v); setPreference("showOnLeaderboard", v); }}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-edge bg-card p-4">
              <div>
                <p className="text-sm font-medium text-content">{t("publicProfile")}</p>
                <p className="text-xs text-content-muted">{t("publicProfileDesc")}</p>
              </div>
              <SettingsSwitch
                checked={publicProfile}
                onCheckedChange={(v) => { setPublicProfile(v); setPreference("publicProfile", v); }}
              />
            </div>
          </div>
        </section>

        {/* Connected Accounts (OAuth) */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">
            {t("accounts")}
          </h2>
          {session?.user ? (
            <div className="flex items-center justify-between rounded-xl border border-edge bg-card p-4">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <Image src={session.user.image} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
                )}
                <div>
                  <p className="text-sm font-medium text-content">{session.user.name}</p>
                  <p className="text-xs text-content-muted">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-edge px-3 py-1.5 text-xs text-content-secondary hover:text-content"
              >
                {t("disconnect")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => signIn("google")}
                className="flex w-full items-center gap-3 rounded-xl border border-edge bg-card p-4 transition-colors hover:bg-card-hover"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-sm text-content">{t("connectGoogle")}</span>
              </button>
              <button
                onClick={() => signIn("github")}
                className="flex w-full items-center gap-3 rounded-xl border border-edge bg-card p-4 transition-colors hover:bg-card-hover"
              >
                <svg className="h-5 w-5 text-content" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <span className="text-sm text-content">{t("connectGithub")}</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
