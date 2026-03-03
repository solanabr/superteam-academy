"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PaintBrush01Icon,
  LanguageSkillIcon,
  Wallet01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { setLocale } from "@/lib/actions";
import { useLocale } from "next-intl";
import { locales } from "@/i18n/config";
import { useState, useTransition } from "react";
import { useWallet } from "@/hooks/use-wallet";

export default function SettingsPage() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();
  const { ready, authenticated, login, logout, address } = useWallet();
  const [notifications, setNotifications] = useState({
    newCourses: true,
    streakReminder: true,
    leaderboard: false,
  });

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  function handleLocaleChange(locale: string) {
    startTransition(async () => {
      await setLocale(locale);
      window.location.reload();
    });
  }

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("settings.heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={PaintBrush01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.appearance")}</CardTitle>
                <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">{t("settings.theme")}</label>
              <div className="flex gap-2">
                {(["system", "light", "dark"] as const).map((value) => {
                  const labelKey = value === "system" ? "themeSystem" : value === "light" ? "themeLight" : "themeDark";
                  return (
                    <Button
                      key={value}
                      variant={theme === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(value)}
                    >
                      {t(`settings.${labelKey}`)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={LanguageSkillIcon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.language")}</CardTitle>
                <CardDescription>{t("settings.languageDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {locales.map((loc) => (
                <Button
                  key={loc}
                  variant={currentLocale === loc ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending}
                >
                  {t(`locale.${loc}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Wallet01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.wallet")}</CardTitle>
                <CardDescription>{t("settings.walletDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("settings.walletStatus")}</span>
                {authenticated && address ? (
                  <span className="text-sm font-medium text-green-500">{formatAddress(address)}</span>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">{t("settings.walletNotConnected")}</span>
                )}
              </div>
              {authenticated && address ? (
                <Button size="sm" variant="outline" className="w-fit" onClick={logout}>
                  Disconnect Wallet
                </Button>
              ) : (
                <Button size="sm" className="w-fit" onClick={login}>
                  {t("common.connectWallet")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Notification01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.notifications")}</CardTitle>
                <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {([
                { key: "newCourses", titleKey: "notifyNewCourses", descKey: "notifyNewCoursesDesc" },
                { key: "streakReminder", titleKey: "notifyStreakReminder", descKey: "notifyStreakReminderDesc" },
                { key: "leaderboard", titleKey: "notifyLeaderboard", descKey: "notifyLeaderboardDesc" },
              ] as const).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(`settings.${item.titleKey}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`settings.${item.descKey}`)}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[item.key]}
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      notifications[item.key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-4 w-4 translate-y-0.5 rounded-full bg-background shadow-sm transition-transform ${
                        notifications[item.key] ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
