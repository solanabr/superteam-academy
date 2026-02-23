"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchStats, createSeason, closeSeason } from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";

export function SeasonsTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [newSeason, setNewSeason] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });

  const createMutation = useMutation({
    mutationFn: () => createSeason(adminSecret, Number(newSeason)),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success(`Season ${newSeason} created`, {
        description: `Mint: ${res.mintAddress}`,
      });
      setNewSeason("");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeSeason(adminSecret),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success("Season closed");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-48" />;

  const config = data?.config;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Current Season
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              {config?.currentSeason ?? "—"}
            </span>
            <Badge variant={config?.seasonClosed ? "destructive" : "default"}>
              {config?.seasonClosed ? "Closed" : "Active"}
            </Badge>
          </div>
          {config && !config.seasonClosed && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {closeMutation.isPending ? "Closing..." : "Close Season"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Create New Season
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">
                Season Number
              </label>
              <Input
                type="number"
                placeholder={String((config?.currentSeason ?? 0) + 1)}
                value={newSeason}
                onChange={(e) => setNewSeason(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newSeason}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
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
