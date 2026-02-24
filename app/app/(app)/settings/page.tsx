"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { User, Bell, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, ThemeSelect } from "@/components/app";
import { getDisplayName, setDisplayName } from "@/lib/display-name";
import { toast } from "sonner";

export default function SettingsPage() {
    const { publicKey } = useWallet();
    const [displayName, setDisplayNameInput] = useState("");

    useEffect(() => {
        if (publicKey) {
            setDisplayNameInput(getDisplayName(publicKey.toBase58()) ?? "");
        } else {
            setDisplayNameInput("");
        }
    }, [publicKey]);

    const handleSave = () => {
        if (!publicKey) return;
        setDisplayName(publicKey.toBase58(), displayName);
        toast.success("Settings saved!");
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <PageHeader title="Settings" subtitle="Manage your account preferences" />

            {/* Account */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Account</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Wallet Address</Label>
                        <Input
                            value={publicKey?.toBase58() ?? ""}
                            disabled
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                            placeholder="Enter your display name"
                            value={displayName}
                            onChange={(e) => setDisplayNameInput(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Notifications</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Notification preferences will be available in a future update.
                </p>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
