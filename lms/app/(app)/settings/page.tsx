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

export default function SettingsPage() {
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-4 text-muted-foreground">Connect your wallet to access settings.</p>
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
    toast.success("Profile updated!");
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
            <Button
              onClick={handleSaveProfile}
              disabled={setDisplayNameMutation.isPending || setBioMutation.isPending}
            >
              {setDisplayNameMutation.isPending || setBioMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
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
      </div>
    </div>
  );
}
