"use client";

import { PageHeader } from "@/components/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateAchievementType,
  useDeactivateAchievementType,
  useIsAdmin,
  useAllAchievementTypes,
} from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import Link from "next/link";

export default function AdminAchievementsPage() {
  const { role } = useIsAdmin();
  const { data: achievementTypes } = useAllAchievementTypes();
  const { mutate: createAchievementType, isPending: creating } =
    useCreateAchievementType();
  const { mutate: deactivateAchievementType, isPending: deactivating } =
    useDeactivateAchievementType();
  const [createForm, setCreateForm] = useState({
    achievementId: "",
    name: "",
    metadataUri: "",
    maxSupply: 0,
    xpReward: 500,
  });
  const [deactivateId, setDeactivateId] = useState("");

  const isAuthority = role === "authority";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        subtitle="Create and deactivate achievement types"
      />

      {isAuthority ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create achievement type</CardTitle>
              <CardDescription>
                Define an achievement badge. Creates Metaplex Core collection.
                maxSupply: 0 = unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[180px]">
                  <Label>achievementId</Label>
                  <Input
                    placeholder="e.g. hackathon-winner"
                    value={createForm.achievementId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        achievementId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 min-w-[180px]">
                  <Label>name</Label>
                  <Input
                    placeholder="e.g. Hackathon Winner"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 min-w-[280px] flex-1">
                  <Label>metadataUri</Label>
                  <Input
                    placeholder="https://arweave.net/..."
                    value={createForm.metadataUri}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        metadataUri: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label>maxSupply (0=unlimited)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.maxSupply}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        maxSupply: +e.target.value || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 w-28">
                  <Label>xpReward</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createForm.xpReward}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        xpReward: +e.target.value || 0,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    disabled={
                      !createForm.achievementId ||
                      !createForm.name ||
                      !createForm.metadataUri ||
                      createForm.xpReward < 1 ||
                      creating
                    }
                    onClick={() =>
                      createAchievementType({
                        achievementId: createForm.achievementId,
                        name: createForm.name,
                        metadataUri: createForm.metadataUri,
                        maxSupply:
                          createForm.maxSupply > 0
                            ? createForm.maxSupply
                            : undefined,
                        xpReward: createForm.xpReward,
                      })
                    }
                  >
                    {creating ? "Creating…" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deactivate achievement type</CardTitle>
              <CardDescription>
                Mark achievement type inactive. Blocks future awards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[220px]">
                  <Label>Achievement type</Label>
                  <Select
                    value={deactivateId}
                    onValueChange={setDeactivateId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select achievement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(achievementTypes ?? []).map((a) => {
                        const acc = a.account as {
                          achievementId?: string;
                          achievement_id?: string;
                          name?: string;
                        };
                        const id =
                          acc.achievementId ??
                          acc.achievement_id ??
                          "";
                        const name = acc.name ?? id;
                        return (
                          <SelectItem key={id} value={id}>
                            {name} ({id})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    disabled={!deactivateId || deactivating}
                    onClick={() =>
                      deactivateAchievementType({ achievementId: deactivateId })
                    }
                  >
                    {deactivating ? "Deactivating…" : "Deactivate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm">
              Only the authority can create or deactivate achievement types.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Full test playground: <Link href="/test" className="text-primary hover:underline">/test</Link>
      </p>
    </div>
  );
}
