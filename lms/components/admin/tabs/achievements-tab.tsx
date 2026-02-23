"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Plus, XCircle, Award } from "lucide-react";
import { toast } from "sonner";
import {
  fetchStats,
  createAchievementType,
  deactivateAchievementType,
  awardAchievement,
} from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { shortenAddress } from "@/lib/utils";

export function AchievementsTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [lastTx, setLastTx] = useState<string | null>(null);

  // Create form
  const [achievementId, setAchievementId] = useState("");
  const [name, setName] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [maxSupply, setMaxSupply] = useState("100");
  const [xpReward, setXpReward] = useState("50");

  // Award form
  const [awardAchId, setAwardAchId] = useState("");
  const [awardRecipient, setAwardRecipient] = useState("");
  const [awardCollection, setAwardCollection] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAchievementType(adminSecret, {
        achievementId,
        name,
        metadataUri: metadataUri || undefined,
        maxSupply: Number(maxSupply),
        xpReward: Number(xpReward),
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success(`Achievement "${name}" created`, {
        description: `Collection: ${res.collectionAddress}`,
      });
      setAchievementId("");
      setName("");
      setMetadataUri("");
      setMaxSupply("100");
      setXpReward("50");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAchievementType(adminSecret, id),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success("Achievement type deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const awardMutation = useMutation({
    mutationFn: () =>
      awardAchievement(adminSecret, {
        achievementId: awardAchId,
        recipient: awardRecipient,
        collection: awardCollection,
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success("Achievement awarded", {
        description: `Asset: ${res.assetAddress}`,
      });
      setAwardRecipient("");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-48" />;

  const types = data?.achievementTypes ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="h-4 w-4" />
            Achievement Types ({types.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No achievement types created
            </p>
          ) : (
            <div className="space-y-2">
              {types.map((a) => (
                <div
                  key={a.publicKey}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.name}</span>
                      <Badge variant={a.isActive ? "default" : "secondary"}>
                        {a.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{a.xpReward} XP</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ID: {a.achievementId} · {a.awarded}/{a.maxSupply} awarded
                      {a.collection &&
                        ` · Collection: ${shortenAddress(a.collection, 6)}`}
                    </p>
                  </div>
                  {a.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deactivateMutation.mutate(a.achievementId)}
                      disabled={deactivateMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Create Achievement Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">
                Achievement ID
              </label>
              <Input
                placeholder="e.g. first-course"
                value={achievementId}
                onChange={(e) => setAchievementId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <Input
                placeholder="e.g. First Course Complete"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Metadata URI (optional)
              </label>
              <Input
                placeholder="https://arweave.net/..."
                value={metadataUri}
                onChange={(e) => setMetadataUri(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Max Supply
              </label>
              <Input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">XP Reward</label>
              <Input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !achievementId || !name}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createMutation.isPending ? "Creating..." : "Create Type"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Award Achievement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm text-muted-foreground">
                Achievement ID
              </label>
              <Input
                placeholder="e.g. first-course"
                value={awardAchId}
                onChange={(e) => setAwardAchId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Recipient Wallet
              </label>
              <Input
                placeholder="Pubkey..."
                value={awardRecipient}
                onChange={(e) => setAwardRecipient(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Collection Address
              </label>
              <Input
                placeholder="Pubkey..."
                value={awardCollection}
                onChange={(e) => setAwardCollection(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => awardMutation.mutate()}
            disabled={
              awardMutation.isPending ||
              !awardAchId ||
              !awardRecipient ||
              !awardCollection
            }
          >
            <Award className="mr-2 h-4 w-4" />
            {awardMutation.isPending ? "Awarding..." : "Award Achievement"}
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
