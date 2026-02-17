"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDisplayName, useSetDisplayName, useBio, useSetBio, useAvatar, useSetAvatar } from "@/lib/hooks/use-service";
import { AVATARS, getAvatarSrc } from "@/lib/data/avatars";
import Image from "next/image";
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
  const { data: avatar } = useAvatar();
  const setDisplayNameMutation = useSetDisplayName();
  const setBioMutation = useSetBio();
  const setAvatarMutation = useSetAvatar();

  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");

  useEffect(() => {
    if (displayName !== undefined) setNameInput(displayName ?? "");
  }, [displayName]);

  useEffect(() => {
    if (bio !== undefined) setBioInput(bio ?? "");
  }, [bio]);

  useEffect(() => {
    if (avatar !== undefined) setSelectedAvatar(avatar ?? "");
  }, [avatar]);

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("connectToAccess")}</p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    const trimmedName = nameInput.trim();
    const trimmedBio = bioInput.trim();

    const promises: Promise<void>[] = [];
    if (trimmedName !== (displayName ?? "")) {
      promises.push(setDisplayNameMutation.mutateAsync(trimmedName || ""));
    }
    if (trimmedBio !== (bio ?? "")) {
      promises.push(setBioMutation.mutateAsync(trimmedBio || ""));
    }
    if (selectedAvatar !== (avatar ?? "")) {
      promises.push(setAvatarMutation.mutateAsync(selectedAvatar));
    }
    await Promise.all(promises);
    toast.success(t("profileUpdated"));
  };

  const isSaving = setDisplayNameMutation.isPending || setBioMutation.isPending || setAvatarMutation.isPending;

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
              <label className="text-sm font-medium">{t("avatar")}</label>
              <p className="text-xs text-muted-foreground mb-2">{t("chooseAvatar")}</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-[#008c4c] to-[#ffd23f] flex items-center justify-center shrink-0">
                  {getAvatarSrc(selectedAvatar) ? (
                    <Image src={getAvatarSrc(selectedAvatar)!} alt="Avatar" width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(displayName ?? publicKey.toBase58()).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAvatar(a.id)}
                    className={`rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === a.id
                        ? "border-solana-green ring-2 ring-solana-green/30 scale-105"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <Image src={a.src} alt={a.id} width={56} height={56} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
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
              disabled={isSaving}
            >
              {isSaving ? tc("saving") : tc("save")}
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
