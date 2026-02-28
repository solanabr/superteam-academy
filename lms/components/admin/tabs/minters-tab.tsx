"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchStats, registerMinter, revokeMinter } from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { shortenAddress } from "@/lib/utils";

export function MintersTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [minter, setMinter] = useState("");
  const [label, setLabel] = useState("");
  const [maxXp, setMaxXp] = useState("1000");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      registerMinter(adminSecret, {
        minter,
        label,
        maxXpPerCall: Number(maxXp),
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success(`Minter "${label}" registered`);
      setMinter("");
      setLabel("");
      setMaxXp("1000");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (addr: string) => revokeMinter(adminSecret, addr),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success("Minter revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-48" />;

  const minters = data?.minters ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            Registered Minters ({minters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {minters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No minters registered
            </p>
          ) : (
            <div className="space-y-2">
              {minters.map((m) => (
                <div
                  key={m.publicKey}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.label}</span>
                      <Badge variant="outline">
                        max {m.maxXpPerCall} XP/call
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {m.minter ? shortenAddress(m.minter, 8) : "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => m.minter && revokeMutation.mutate(m.minter)}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Register New Minter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">
              Minter Wallet Address
            </label>
            <Input
              placeholder="Pubkey..."
              value={minter}
              onChange={(e) => setMinter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Label</label>
            <Input
              placeholder="e.g. daily-challenge-minter"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Max XP per Call
            </label>
            <Input
              type="number"
              value={maxXp}
              onChange={(e) => setMaxXp(e.target.value)}
            />
          </div>
          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !minter || !label || !maxXp}
          >
            <Plus className="mr-2 h-4 w-4" />
            {registerMutation.isPending ? "Registering..." : "Register Minter"}
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
