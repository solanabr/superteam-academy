"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/lib/store/user-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Label } from "@radix-ui/react-label";
import { ShieldAlert, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const locale = useUserStore((state) => state.locale);
  const setLocale = useUserStore((state) => state.setLocale);
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const setTheme = useUserStore((state) => state.setTheme);
  const theme = useUserStore((state) => state.theme);
  const wallet = useWallet();
  const { setTheme: setResolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({
    compactView: false,
    autoplay: true,
    emailUpdates: true,
  });

  useEffect(() => setMounted(true), []);

  const handleThemeChange = (value: "dark" | "light" | "system") => {
    setTheme(value);
    setResolvedTheme(value);
  };

  if (!wallet.connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8">
          <Wallet className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Connect your wallet</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Connect your Solana wallet to access settings.
          </p>
          {mounted && (
            <div className="mt-6">
              <WalletMultiButton className="rounded-lg! bg-gradient-cta! px-6! py-2! text-cta-foreground!" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border border-border">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{profile.displayName}</p>
                <p>@{profile.username}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Display name</Label>
              <Input
                value={profile.displayName}
                onChange={(e) => updateProfile({ displayName: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Bio</Label>
              <Input
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">{t("appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Theme</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => handleThemeChange("dark")}>Dark</Button>
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => handleThemeChange("light")}>Light</Button>
                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => handleThemeChange("system")}>System</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Language</Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "pt-BR" | "es") }>
                <SelectTrigger className="bg-secondary/50">
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
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">{t("notifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
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

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">{t("wallet")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Connected: {wallet.connected ? "Yes" : "No"}</p>
            <p className="break-all text-xs text-muted-foreground/70">{wallet.publicKey?.toBase58() ?? "No wallet connected"}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-4" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Deleting your account is permanent and removes your local learning data.</p>
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
    <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-6 w-11 items-center rounded-full transition ${active ? "bg-st-yellow/80" : "bg-secondary"}`}
        aria-pressed={active}
        aria-label={`Toggle ${label}`}
      >
        <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
