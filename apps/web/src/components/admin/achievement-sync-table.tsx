"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";

interface AchievementStatus {
  sanityId: string;
  name: string;
  missingFields: string[];
  onChainStatus: "synced" | "not_deployed" | "missing_fields" | "draft";
  achievementPda: string | null;
  collectionAddress: string | null;
}

interface AchievementSyncTableProps {
  achievements: AchievementStatus[];
  adminToken: string;
  onRefresh: () => void;
}

export function AchievementSyncTable({
  achievements,
  adminToken,
  onRefresh,
}: AchievementSyncTableProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync(achievementId: string) {
    setSyncing(achievementId);
    setError(null);
    try {
      const res = await fetch("/api/admin/achievements/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ achievementId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Sync failed");
      } else {
        onRefresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    setError(null);
    const syncable = achievements.filter(
      (a) =>
        a.missingFields.length === 0 &&
        (a.onChainStatus === "not_deployed" ||
          (a.onChainStatus === "synced" && !a.collectionAddress))
    );
    for (const ach of syncable) {
      setSyncing(ach.sanityId);
      try {
        const res = await fetch("/api/admin/achievements/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ achievementId: ach.sanityId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? `Sync failed for ${ach.name}`);
          onRefresh();
          break;
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : `Sync failed for ${ach.name}`
        );
        onRefresh();
        break;
      }
    }
    setSyncing(null);
    setSyncingAll(false);
    onRefresh();
  }

  const syncableCount = achievements.filter(
    (a) =>
      a.missingFields.length === 0 &&
      (a.onChainStatus === "not_deployed" ||
        (a.onChainStatus === "synced" && !a.collectionAddress))
  ).length;

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {syncableCount > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => void handleSyncAll()}
            disabled={syncingAll}
            className="rounded-md border border-border bg-card px-4 py-1.5 text-xs font-medium text-text shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active disabled:pointer-events-none disabled:opacity-50"
          >
            {syncingAll ? "Syncing..." : `Sync All (${syncableCount})`}
          </button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-3">
            <th className="pb-2 pr-4 font-medium">Achievement</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Collection</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {achievements.map((ach) => {
            const isSyncing = syncing === ach.sanityId;
            const canDeploy =
              ach.onChainStatus === "not_deployed" &&
              ach.missingFields.length === 0;
            const needsCollectionRecovery =
              ach.onChainStatus === "synced" && !ach.collectionAddress;

            return (
              <tr
                key={ach.sanityId}
                className="transition-colors hover:bg-subtle"
              >
                <td className="py-3 pr-4">
                  <div className="font-medium text-text">{ach.name}</div>
                  {ach.missingFields.length > 0 && (
                    <div className="mt-1 text-xs text-streak">
                      Missing: {ach.missingFields.join(", ")}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={ach.onChainStatus} />
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-text-3">
                  {ach.collectionAddress
                    ? `${ach.collectionAddress.slice(0, 8)}...${ach.collectionAddress.slice(-4)}`
                    : "—"}
                </td>
                <td className="py-3">
                  {(canDeploy || needsCollectionRecovery) && (
                    <button
                      onClick={() => void handleSync(ach.sanityId)}
                      disabled={isSyncing}
                      className="rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncing
                        ? "..."
                        : needsCollectionRecovery
                          ? "Sync"
                          : "Deploy"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
