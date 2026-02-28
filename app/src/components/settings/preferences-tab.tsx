"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { setLocale } from "@/i18n/actions";
import { type Locale } from "@/i18n/config";
import { Globe, Moon, Sun, Monitor, Bell } from "lucide-react";
import { Toggle } from "./toggle";

const NOTIF_STORAGE_KEY = "sta-notifications";

function loadNotifications() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function PreferencesTab() {
  const t = useTranslations("settings");
  const currentLocale = useLocale();
  const router = useRouter();
  const { theme: currentTheme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const notifInit = loadNotifications();
  const [emailNotifications, setEmailNotifications] = useState(
    typeof notifInit?.email === "boolean" ? notifInit.email : true
  );
  const [courseUpdates, setCourseUpdates] = useState(
    typeof notifInit?.courseUpdates === "boolean" ? notifInit.courseUpdates : true
  );
  const [achievementAlerts, setAchievementAlerts] = useState(
    typeof notifInit?.achievements === "boolean" ? notifInit.achievements : true
  );
  const [streakReminders, setStreakReminders] = useState(
    typeof notifInit?.streakReminders === "boolean" ? notifInit.streakReminders : false
  );

  const persistNotifications = useCallback(
    (key: string, value: boolean) => {
      const current = loadNotifications() || {};
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify({ ...current, [key]: value }));
    },
    []
  );

  function handleLocaleChange(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  const languages: { key: Locale; label: string }[] = [
    { key: "en", label: "English" },
    { key: "pt-BR", label: "Portugu\u00eas (BR)" },
    { key: "es", label: "Espa\u00f1ol" },
  ];

  const themes = [
    { key: "dark" as const, label: t("preferencesSection.themeDark"), icon: <Moon className="h-4 w-4" /> },
    { key: "light" as const, label: t("preferencesSection.themeLight"), icon: <Sun className="h-4 w-4" /> },
    { key: "system" as const, label: t("preferencesSection.themeSystem"), icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Language */}
      <div>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t("preferencesSection.language")}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("preferencesSection.languageDescription")}
        </p>
        <div className={`mt-4 space-y-3 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
          {languages.map((lang) => (
            <label
              key={lang.key}
              className="flex cursor-pointer items-center gap-3"
            >
              <div className="relative flex h-5 w-5 items-center justify-center">
                <input
                  type="radio"
                  name="language"
                  value={lang.key}
                  checked={currentLocale === lang.key}
                  onChange={() => handleLocaleChange(lang.key)}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-full border-2 border-border transition-colors peer-checked:border-st-green" />
                <div
                  className={`absolute h-2.5 w-2.5 rounded-full transition-colors ${
                    currentLocale === lang.key ? "bg-st-green" : "bg-transparent"
                  }`}
                />
              </div>
              <span className="text-sm text-foreground">{lang.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div>
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t("preferencesSection.theme")}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("preferencesSection.themeDescription")}
        </p>
        <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1">
          {themes.map((themeOption) => (
            <button
              key={themeOption.key}
              type="button"
              onClick={() => setTheme(themeOption.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                currentTheme === themeOption.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {themeOption.icon}
              {themeOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t("notifications")}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("notificationsSection.description")}
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("notificationsSection.emailNotifications")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationsSection.emailDescription")}
              </p>
            </div>
            <Toggle
              enabled={emailNotifications}
              onToggle={() => { setEmailNotifications(!emailNotifications); persistNotifications("email", !emailNotifications); }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("notificationsSection.courseUpdates")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationsSection.courseUpdatesDescription")}
              </p>
            </div>
            <Toggle
              enabled={courseUpdates}
              onToggle={() => { setCourseUpdates(!courseUpdates); persistNotifications("courseUpdates", !courseUpdates); }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("notificationsSection.achievements")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationsSection.achievementsDescription")}
              </p>
            </div>
            <Toggle
              enabled={achievementAlerts}
              onToggle={() => { setAchievementAlerts(!achievementAlerts); persistNotifications("achievements", !achievementAlerts); }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("notificationsSection.streakReminder")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationsSection.streakReminderDescription")}
              </p>
            </div>
            <Toggle
              enabled={streakReminders}
              onToggle={() => { setStreakReminders(!streakReminders); persistNotifications("streakReminders", !streakReminders); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
