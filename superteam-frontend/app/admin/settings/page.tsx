"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Shield, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type OnChainConfig = {
  authority: string;
  backendSigner: string;
  currentSeason: number;
  currentMint: string;
  seasonClosed: boolean;
  bump: number;
  address: string;
} | null;

type PlatformConfig = {
  dailyXpCap: number;
  maxStreakFreeze: number;
  maintenanceMode: boolean;
  registrationOpen: boolean;
};

export default function AdminSettingsPage() {
  const [chainConfig, setChainConfig] = useState<OnChainConfig>(null);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(
        (d: { platformConfig: PlatformConfig; chainConfig: OnChainConfig }) => {
          setConfig(d.platformConfig);
          setChainConfig(d.chainConfig);
        },
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    toast.success("Settings saved");
  }

  if (loading || !config) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function shortAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* On-chain Config (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            On-Chain Configuration
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chainConfig ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Authority
                </Label>
                <p className="font-mono text-sm">
                  {shortAddress(chainConfig.authority)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Backend Signer
                </Label>
                <p className="font-mono text-sm">
                  {shortAddress(chainConfig.backendSigner)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Current Season
                </Label>
                <p className="text-sm font-medium">
                  Season {chainConfig.currentSeason}
                  {chainConfig.seasonClosed && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Closed
                    </Badge>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">XP Mint</Label>
                <p className="font-mono text-sm">
                  {shortAddress(chainConfig.currentMint)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Config PDA
                </Label>
                <p className="font-mono text-sm">
                  {shortAddress(chainConfig.address)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Bump</Label>
                <p className="text-sm font-medium">{chainConfig.bump}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to fetch on-chain config. The program may not be deployed
              or RPC may be unavailable.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Platform Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Daily XP Cap</Label>
              <Input
                type="number"
                value={config.dailyXpCap}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev
                      ? { ...prev, dailyXpCap: Number(e.target.value) }
                      : prev,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum XP a learner can earn per day.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Max Streak Freeze</Label>
              <Input
                type="number"
                value={config.maxStreakFreeze}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev
                      ? { ...prev, maxStreakFreeze: Number(e.target.value) }
                      : prev,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Max streak freeze tokens a learner can hold.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Disable platform access for non-admins.
                </p>
              </div>
              <Switch
                checked={config.maintenanceMode}
                onCheckedChange={(v) =>
                  setConfig((prev) =>
                    prev ? { ...prev, maintenanceMode: v } : prev,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Registration Open</Label>
                <p className="text-xs text-muted-foreground">
                  Allow new learners to register.
                </p>
              </div>
              <Switch
                checked={config.registrationOpen}
                onCheckedChange={(v) =>
                  setConfig((prev) =>
                    prev ? { ...prev, registrationOpen: v } : prev,
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
