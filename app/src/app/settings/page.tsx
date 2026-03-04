"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLocale } from "@/contexts/locale-context";
import { useTheme } from "@/contexts/theme-context";
import type { SupportedLocale } from "@/config/constants";
import { SUPPORTED_LOCALES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Wallet,
  Globe,
  Sun,
  Moon,
  Monitor,
  Shield,
  CheckCircle,
} from "lucide-react";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
};

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "settings",
        JSON.stringify({
          displayName,
          bio,
          avatarUrl,
          showLeaderboard,
          publicProfile,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Section */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">
                {t("settings.profileSection")}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("settings.displayName")}
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="your_username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("settings.bio")}
              </label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("settings.avatar")}
              </label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">
                {t("settings.accountSection")}
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  {t("settings.connectedWallet")}
                </label>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {connected
                    ? publicKey?.toBase58()
                    : t("wallet.connect")}
                </p>
              </div>
              {!connected && (
                <Button
                  size="sm"
                  onClick={() => setVisible(true)}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
                >
                  {t("wallet.connect")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language & Theme */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">
                {t("settings.languageSection")}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("settings.language")}
              </label>
              <Select value={locale} onValueChange={(v) => setLocale(v as SupportedLocale)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {LOCALE_LABELS[loc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("settings.theme")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "dark" as const, icon: Moon, label: t("settings.dark") },
                  { value: "light" as const, icon: Sun, label: t("settings.light") },
                  { value: "system" as const, icon: Monitor, label: t("settings.system") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-all ${
                      theme === opt.value
                        ? "border-violet-500 bg-violet-500/10 text-violet-500"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <opt.icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">
                {t("settings.privacySection")}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("settings.showOnLeaderboard")}
              </label>
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  showLeaderboard ? "bg-violet-500" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    showLeaderboard ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("settings.showProfile")}
              </label>
              <button
                onClick={() => setPublicProfile(!publicProfile)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  publicProfile ? "bg-violet-500" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    publicProfile ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              {t("settings.saved")}
            </span>
          )}
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
