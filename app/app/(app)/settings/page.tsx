"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { User, Bell, Volume2, Shuffle } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PixelAvatar } from "@/components/app";
import { getAvatarVersion, setAvatarVersion } from "@/components/app/PixelAvatar";
import { getDisplayName, setDisplayName } from "@/lib/display-name";
import { useSfx } from "@/hooks";
import { toast } from "sonner";

export default function SettingsPage() {
    const { publicKey } = useWallet();
    const [displayName, setDisplayNameInput] = useState("");
    const [avatarVersion, setAvatarVersionState] = useState("");
    const sfx = useSfx();

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
        toast.success("Avatar shuffled!");
    };

    const handleSave = () => {
        if (!publicKey) return;
        setDisplayName(publicKey.toBase58(), displayName);
        sfx.playSuccess();
        toast.success("Settings saved!");
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-10 md:px-12">
            <PageHeader title="Settings" subtitle="Manage your account preferences" />

            {/* Avatar */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Shuffle className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">Avatar</h3>
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
                            Your unique pixel avatar is generated from your wallet address.
                        </p>
                        <Button
                            variant="pixel"
                            size="sm"
                            onClick={handleShuffle}
                            className="font-game text-lg"
                        >
                            <Shuffle className="h-4 w-4 mr-1" />
                            Shuffle Avatar
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Account */}
            <Card className="p-5 border-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-yellow-400" />
                    <h3 className="font-game text-2xl">Account</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-game text-lg text-gray-400">Wallet Address</Label>
                        <Input
                            value={publicKey?.toBase58() ?? ""}
                            disabled
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-game text-lg text-gray-400">Display Name</Label>
                        <Input
                            placeholder="Enter your display name"
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
                    <h3 className="font-game text-2xl">Sound Effects</h3>
                </div>
                <div className="flex items-center justify-between">
                    <p className="font-game text-lg text-gray-400">
                        Enable 8-bit sound effects
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
                    <h3 className="font-game text-2xl">Notifications</h3>
                </div>
                <p className="font-game text-lg text-gray-400">
                    Notification preferences will be available in a future update.
                </p>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} variant="pixel" className="font-game text-xl">
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
