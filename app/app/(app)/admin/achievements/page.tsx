"use client";

import { PageHeader } from "@/components/app";
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Achievements"
        subtitle="Create and deactivate achievement types"
      />

      {isAuthority ? (
        <>
          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Create achievement type</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Define an achievement badge. Creates Metaplex Core collection.
              maxSupply: 0 = unlimited.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[160px] sm:max-w-[220px]">
                <Label className="font-game">achievementId</Label>
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
              <div className="space-y-2 w-full min-w-0 sm:min-w-[160px] sm:max-w-[220px]">
                <Label className="font-game">name</Label>
                <Input
                  placeholder="e.g. Hackathon Winner"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 w-full min-w-0 flex-1 sm:min-w-[200px]">
                <Label className="font-game">metadataUri</Label>
                <Input
                  placeholder="https://… (Pinata or other gateway)"
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
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
              <div className="space-y-2">
                <Label className="font-game">maxSupply (0=unlimited)</Label>
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
              <div className="space-y-2 w-full min-w-0 sm:w-28">
                <Label className="font-game">xpReward</Label>
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
                  variant="pixel"
                  className="font-game"
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
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Deactivate achievement type</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Mark achievement type inactive. Blocks future awards.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[180px] sm:max-w-[260px]">
                <Label className="font-game">Achievement type</Label>
                <Select
                  value={deactivateId}
                  onValueChange={setDeactivateId}
                >
                  <SelectTrigger className="w-full font-game">
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
                  variant="pixel"
                  className="font-game"
                  disabled={!deactivateId || deactivating}
                  onClick={() =>
                    deactivateAchievementType({ achievementId: deactivateId })
                  }
                >
                  {deactivating ? "Deactivating…" : "Deactivate"}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <p className="font-game text-muted-foreground text-sm">
            Only the authority can create or deactivate achievement types.
          </p>
        </div>
      )}

      <p className="font-game text-sm text-muted-foreground">
        Full test playground: <Link href="/test" className="text-yellow-400 hover:underline">/test</Link>
      </p>
    </div>
  );
}
