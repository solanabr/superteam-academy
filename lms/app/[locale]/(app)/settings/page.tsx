"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDisplayName, useSetDisplayName, useBio, useSetBio } from "@/lib/hooks/use-service";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { FlagUS, FlagBR, FlagES, FlagIN } from "@/components/shared/flags";

const LOCALE_OPTIONS: { code: Locale; flag: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { code: "en", flag: FlagUS, labelKey: "english" },
  { code: "pt-BR", flag: FlagBR, labelKey: "portuguese" },
  { code: "es", flag: FlagES, labelKey: "spanish" },
  { code: "hi", flag: FlagIN, labelKey: "hindi" },
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { publicKey, disconnect, connected } = useWallet();
  const { data: displayName } = useDisplayName();
  const { data: bio } = useBio();
  const setDisplayNameMutation = useSetDisplayName();
  const setBioMutation = useSetBio();

  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");

  useEffect(() => {
    if (displayName !== undefined) setNameInput(displayName ?? "");
  }, [displayName]);

  useEffect(() => {
    if (bio !== undefined) setBioInput(bio ?? "");
  }, [bio]);

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("connectToAccess")}</p>
      </div>
    );
  }

  const handleSaveProfile = () => {
    const trimmedName = nameInput.trim();
    const trimmedBio = bioInput.trim();

    if (trimmedName !== (displayName ?? "")) {
      setDisplayNameMutation.mutate(trimmedName || "");
    }
    if (trimmedBio !== (bio ?? "")) {
      setBioMutation.mutate(trimmedBio || "");
    }
    toast.success(t("profileUpdated"));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("displayName")}</label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("bio")}</label>
              <Input
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder={t("bioPlaceholder")}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={setDisplayNameMutation.isPending || setBioMutation.isPending}
            >
              {setDisplayNameMutation.isPending || setBioMutation.isPending ? tc("saving") : tc("save")}
            </Button>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <CardTitle>{t("wallet")}</CardTitle>
            <CardDescription>{t("walletDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("connectedAddress")}</p>
                <p className="text-xs text-muted-foreground font-mono">{publicKey.toBase58()}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-solana-green" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("network")}</span>
              <span className="text-sm text-muted-foreground">Devnet</span>
            </div>
            <Button variant="outline" onClick={() => disconnect()}>{t("disconnectWallet")}</Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("publicProfile")}</p>
                <p className="text-xs text-muted-foreground">{t("publicProfileDescription")}</p>
              </div>
              <Switch
                checked={profileVisibility === "public"}
                onCheckedChange={(c) => setProfileVisibility(c ? "public" : "private")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>{t("language")}</CardTitle>
            <CardDescription>{t("languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {LOCALE_OPTIONS.map(({ code, flag: Flag, labelKey }) => (
                <Button
                  key={code}
                  variant={locale === code ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => router.replace("/settings", { locale: code })}
                >
                  <Flag className="h-4 w-5" />
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
