"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { User, Bell, Volume2, Shuffle, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PixelAvatar, LanguageSwitcher } from "@/components/app";
import { getAvatarVersion, setAvatarVersion } from "@/components/app/PixelAvatar";
import { getDisplayName, setDisplayName } from "@/lib/display-name";
import { useSfx } from "@/hooks";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
    const { publicKey } = useWallet();
    const [displayName, setDisplayNameInput] = useState("");
    const [avatarVersion, setAvatarVersionState] = useState("");
    const sfx = useSfx();
    const t = useTranslations("settings");
    const tCommon = useTranslations("common");

    useEffect(() => {
        if (publicKey) {
            setDisplayNameInput(getDisplayName(publicKey.toBase58()) ?? "");
            setAvatarVersionState(getAvatarVersion(publicKey.toBase58()));
        } else {
            setDisplayNameInput("");
            setAvatarVersionState("");
        }
    }, [publicKey]);

    const handleShuffle = () => {
        if (!publicKey) return;
        const newVersion = String(Date.now());
        setAvatarVersion(publicKey.toBase58(), newVersion);
        setAvatarVersionState(newVersion);
        sfx.playSuccess();
        toast.success(t("avatarShuffled"));
    };

    const handleSave = () => {
        if (!publicKey) return;
        setDisplayName(publicKey.toBase58(), displayName);
        sfx.playSuccess();
        toast.success(t("saved"));
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-10 md:px-12">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            {/* Language */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Languages className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">{tCommon("language")}</h3>
                </div>
                <LanguageSwitcher />
            </Card>

            {/* Avatar */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Shuffle className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">{t("avatar")}</h3>
                </div>
                <div className="flex items-center gap-6">
                    {publicKey ? (
                        <PixelAvatar
                            wallet={publicKey.toBase58()}
                            size="xl"
                            version={avatarVersion || undefined}
                            className="border-4 border-zinc-700"
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-zinc-800 border-4 border-zinc-700" />
                    )}
                    <div className="space-y-2">
                        <p className="font-game text-lg text-gray-400">
                            {t("avatarHint")}
                        </p>
                        <Button
                            variant="pixel"
                            size="sm"
                            onClick={handleShuffle}
                            className="font-game text-lg"
                        >
                            <Shuffle className="h-4 w-4 mr-1" />
                            {t("shuffleAvatar")}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Account */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">{tCommon("account")}</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-game text-lg text-gray-400">{t("walletAddress")}</Label>
                        <Input
                            value={publicKey?.toBase58() ?? ""}
                            disabled
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-game text-lg text-gray-400">{t("displayName")}</Label>
                        <Input
                            placeholder={t("displayNamePlaceholder")}
                            value={displayName}
                            onChange={(e) => setDisplayNameInput(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Sound Effects */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">{t("soundEffects")}</h3>
                </div>
                <div className="flex items-center justify-between">
                    <p className="font-game text-lg text-gray-400">
                        {t("soundEffectsHint")}
                    </p>
                    <Button
                        variant={sfx.enabled ? "pixel" : "outline"}
                        size="sm"
                        onClick={sfx.toggle}
                        className="font-game text-lg"
                    >
                        {sfx.enabled ? "ON" : "OFF"}
                    </Button>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">{t("notifications")}</h3>
                </div>
                <p className="font-game text-lg text-gray-400">
                    {t("notificationsHint")}
                </p>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} variant="pixel" className="font-game text-xl">
                    {tCommon("saveChanges")}
                </Button>
            </div>
        </div>
    );
}
