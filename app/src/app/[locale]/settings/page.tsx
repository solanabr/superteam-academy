"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { WalletInfo } from "@/components/auth/wallet-info";
import { ConnectPrompt } from "@/components/auth/connect-prompt";
import { toast } from "sonner";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const { connected } = useWallet();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [locale, setLocaleState] = useState("en");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`);
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ConnectPrompt message={t("connectToManageSettings")} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
          <TabsTrigger value="wallet">{t("wallet")}</TabsTrigger>
          <TabsTrigger value="language">{t("language")}</TabsTrigger>
          <TabsTrigger value="theme">{t("theme")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("profileSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("username")}</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("displayName")}</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("bio")}</Label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                />
              </div>
              <Button onClick={() => handleSave("Profile")}>{t("save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>{t("walletSettings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletInfo />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t("languageSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { code: "en", label: "English" },
                { code: "pt-BR", label: "Português (Brasil)" },
                { code: "es", label: "Español" },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocaleState(l.code);
                    const path = window.location.pathname.replace(
                      /^\/(en|pt-BR|es)/,
                      `/${l.code}`
                    );
                    window.location.href = path;
                  }}
                  className={cn(
                    "flex items-center w-full px-4 py-3 rounded-lg border transition-colors",
                    locale === l.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{l.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>{t("themeSettings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "dark", icon: Moon, label: t("dark") },
                  { value: "light", icon: Sun, label: t("light") },
                  { value: "system", icon: Monitor, label: t("system") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                      theme === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <opt.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t("emailNotifications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("emailNotificationsDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifs(!emailNotifs)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    emailNotifs ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      emailNotifs && "translate-x-5"
                    )}
                  />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t("pushNotifications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pushNotificationsDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setPushNotifs(!pushNotifs)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    pushNotifs ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      pushNotifs && "translate-x-5"
                    )}
                  />
                </button>
              </div>
              <Button onClick={() => handleSave("Notification")}>
                {t("save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
