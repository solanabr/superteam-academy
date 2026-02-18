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

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
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
                  {canDeploy && (
                    <button
                      onClick={() => void handleSync(ach.sanityId)}
                      disabled={isSyncing}
                      className="rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncing ? "..." : "Deploy"}
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
