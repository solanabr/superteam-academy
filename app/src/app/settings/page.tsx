"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/lib/store/user-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Label } from "@radix-ui/react-label";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const locale = useUserStore((state) => state.locale);
  const setLocale = useUserStore((state) => state.setLocale);
  const profile = useUserStore((state) => state.profile);
  const setTheme = useUserStore((state) => state.setTheme);
  const theme = useUserStore((state) => state.theme);
  const wallet = useWallet();
  const { setTheme: setResolvedTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    compactView: false,
    autoplay: true,
    emailUpdates: true,
  });

  const handleThemeChange = (value: "dark" | "light" | "system") => {
    setTheme(value);
    setResolvedTheme(value);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-100">{t("title")}</h1>
        <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border border-white/15">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-zinc-300">
                <p className="font-semibold text-zinc-100">{profile.displayName}</p>
                <p>@{profile.username}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Display name</Label>
              <Input defaultValue={profile.displayName} className="bg-zinc-950/60" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Bio</Label>
              <Input defaultValue={profile.bio} className="bg-zinc-950/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Theme</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => handleThemeChange("dark")}>Dark</Button>
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => handleThemeChange("light")}>Light</Button>
                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => handleThemeChange("system")}>System</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Language</Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "pt-BR" | "es") }>
                <SelectTrigger className="bg-zinc-950/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="pt-BR">PT-BR</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("notifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <PreferenceRow
              label={t("compactView")}
              active={notifications.compactView}
              onToggle={() => setNotifications((prev) => ({ ...prev, compactView: !prev.compactView }))}
            />
            <PreferenceRow
              label={t("autoplay")}
              active={notifications.autoplay}
              onToggle={() => setNotifications((prev) => ({ ...prev, autoplay: !prev.autoplay }))}
            />
            <PreferenceRow
              label={t("emailUpdates")}
              active={notifications.emailUpdates}
              onToggle={() => setNotifications((prev) => ({ ...prev, emailUpdates: !prev.emailUpdates }))}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("wallet")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Connected: {wallet.connected ? "Yes" : "No"}</p>
            <p className="break-all text-xs text-zinc-500">{wallet.publicKey?.toBase58() ?? "No wallet connected"}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-red-500/30 bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-200">
            <ShieldAlert className="size-4" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-200/80">Deleting your account is permanent and removes your local learning data.</p>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-500">
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-6 w-11 items-center rounded-full transition ${active ? "bg-[#14F195]/80" : "bg-zinc-700"}`}
        aria-pressed={active}
        aria-label={`Toggle ${label}`}
      >
        <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
