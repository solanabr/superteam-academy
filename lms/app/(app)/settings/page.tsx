"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/lib/stores/user-store";
import { shortenAddress } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const { publicKey, disconnect, connected } = useWallet();
  const { displayName, bio, profileVisibility, setDisplayName, setBio, setProfileVisibility, reset } = useUserStore();

  const [nameInput, setNameInput] = useState(displayName ?? "");
  const [bioInput, setBioInput] = useState(bio ?? "");

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-4 text-muted-foreground">Connect your wallet to access settings.</p>
      </div>
    );
  }

  const handleSaveProfile = () => {
    setDisplayName(nameInput || null);
    setBio(bioInput || null);
    toast.success("Profile updated!");
  };

  const handleClearData = () => {
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("sta_"));
      keys.forEach((k) => localStorage.removeItem(k));
    }
    reset();
    toast.success("All data cleared.");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your display name and bio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter display name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Input
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Tell us about yourself"
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Connected wallet information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected Address</p>
                <p className="text-xs text-muted-foreground font-mono">{publicKey.toBase58()}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-solana-green" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <span className="text-sm text-muted-foreground">Devnet</span>
            </div>
            <Button variant="outline" onClick={() => disconnect()}>Disconnect Wallet</Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public Profile</p>
                <p className="text-xs text-muted-foreground">Allow others to see your profile</p>
              </div>
              <Switch
                checked={profileVisibility === "public"}
                onCheckedChange={(c) => setProfileVisibility(c ? "public" : "private")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Clear All Local Data</p>
                <p className="text-xs text-muted-foreground">Remove all locally stored progress, settings, and achievements.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
