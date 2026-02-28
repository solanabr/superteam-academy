"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { fetchStats, updateConfig } from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { shortenAddress } from "@/lib/utils";

export function ConfigTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [newBackendSigner, setNewBackendSigner] = useState("");
  const [maxDailyXp, setMaxDailyXp] = useState("");
  const [maxAchievementXp, setMaxAchievementXp] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });

  const mutation = useMutation({
    mutationFn: () =>
      updateConfig(adminSecret, {
        newBackendSigner: newBackendSigner || undefined,
        maxDailyXp: maxDailyXp ? Number(maxDailyXp) : undefined,
        maxAchievementXp: maxAchievementXp
          ? Number(maxAchievementXp)
          : undefined,
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success("Config updated");
      setNewBackendSigner("");
      setMaxDailyXp("");
      setMaxAchievementXp("");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-48" />;

  const config = data?.config;

  return (
    <div className="space-y-6">
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Current Config
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Authority</dt>
                <dd className="font-mono">
                  {config.authority ? shortenAddress(config.authority, 8) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Backend Signer</dt>
                <dd className="font-mono">
                  {config.backendSigner
                    ? shortenAddress(config.backendSigner, 8)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">XP Mint</dt>
                <dd className="font-mono">
                  {config.xpMint ? shortenAddress(config.xpMint, 8) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Season</dt>
                <dd>
                  {config.currentSeason}{" "}
                  {config.seasonClosed ? "(closed)" : "(active)"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Daily XP</dt>
                <dd>{config.maxDailyXp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Achievement XP</dt>
                <dd>{config.maxAchievementXp}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Update Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">
              New Backend Signer (leave empty to keep current)
            </label>
            <Input
              placeholder="Pubkey..."
              value={newBackendSigner}
              onChange={(e) => setNewBackendSigner(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">
                Max Daily XP (leave empty to keep current)
              </label>
              <Input
                type="number"
                placeholder={String(config?.maxDailyXp ?? "")}
                value={maxDailyXp}
                onChange={(e) => setMaxDailyXp(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Max Achievement XP (leave empty to keep current)
              </label>
              <Input
                type="number"
                placeholder={String(config?.maxAchievementXp ?? "")}
                value={maxAchievementXp}
                onChange={(e) => setMaxAchievementXp(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              (!newBackendSigner && !maxDailyXp && !maxAchievementXp)
            }
          >
            {mutation.isPending ? "Updating..." : "Update Config"}
          </Button>
        </CardContent>
      </Card>

      {lastTx && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last tx:</span>
          <TxResult signature={lastTx} />
        </div>
      )}
    </div>
  );
}
