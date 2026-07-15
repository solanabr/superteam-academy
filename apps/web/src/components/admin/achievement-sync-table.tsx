"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AwardT } from "@superteam-lms/content-schema";
import { StatusBadge } from "./status-badge";
import { AdminTableShell } from "./admin-table-shell";
import { AdminButton } from "./admin-button";
import { AdminBadge } from "./admin-badge";

interface AchievementStatus {
  contentId: string;
  name: string;
  missingFields: string[];
  onChainStatus:
    | "synced"
    | "not_deployed"
    | "missing_fields"
    | "draft"
    // #436: Supabase deployment-row read failed — StatusBadge renders it
    // distinctly (never falls back to "synced").
    | "db_unavailable";
  achievementPda: string | null;
  collectionAddress: string | null;
  /**
   * The declarative unlock rule (#513 WS-C) — when it targets a course or
   * path, the row optionally surfaces which one below the achievement name.
   * `null`/`undefined` for a pre-sync/legacy doc or an award kind with no ref
   * (e.g. `streak`, `manual`).
   */
  award?: AwardT | null;
}

interface AchievementSyncTableProps {
  achievements: AchievementStatus[];
  onRefresh: () => void;
  /** `award.course` id → title, for resolving the optional award-ref line. */
  courseTitleById?: Record<string, string>;
  /** `award.path` id → title, for resolving the optional award-ref line. */
  pathTitleById?: Record<string, string>;
}

/** Award kinds that carry a course ref (issue #478's `AwardT` shape). */
function awardCourseId(award: AwardT): string | null {
  return award.kind === "course-completed" ||
    award.kind === "lessons-completed-in-course"
    ? award.course
    : null;
}

function awardPathId(award: AwardT): string | null {
  return award.kind === "path-completed" ? award.path : null;
}

/**
 * Optional "unlocks with course X / path Y" line under an achievement's name
 * (spec: "Optionally surface award.course/award.path"). Reuses the same
 * loud-not-silent convention the Paths dangling-ref view established: a ref
 * id with no matching title renders an `AdminBadge tone="danger"` instead of
 * disappearing.
 */
function AwardRefLine({
  award,
  courseTitleById,
  pathTitleById,
}: {
  award: AwardT | null | undefined;
  courseTitleById: Record<string, string>;
  pathTitleById: Record<string, string>;
}) {
  const t = useTranslations("admin.contentScreen.achievements");
  if (!award) return null;

  const courseId = awardCourseId(award);
  if (courseId) {
    const title = courseTitleById[courseId];
    return title ? (
      <div className="mt-1 text-xs text-text-3">
        {t("awardCourse", { title })}
      </div>
    ) : (
      <div className="mt-1 flex items-center gap-1.5">
        <AdminBadge tone="danger">{t("awardMissingBadge")}</AdminBadge>
        <span className="font-mono text-xs text-text-3">
          {t("awardMissingRef", { id: courseId })}
        </span>
      </div>
    );
  }

  const pathId = awardPathId(award);
  if (pathId) {
    const title = pathTitleById[pathId];
    return title ? (
      <div className="mt-1 text-xs text-text-3">
        {t("awardPath", { title })}
      </div>
    ) : (
      <div className="mt-1 flex items-center gap-1.5">
        <AdminBadge tone="danger">{t("awardMissingBadge")}</AdminBadge>
        <span className="font-mono text-xs text-text-3">
          {t("awardMissingRef", { id: pathId })}
        </span>
      </div>
    );
  }

  return null;
}

/**
 * The achievement on-chain sync table — relocated (#513 WS-C) from the
 * Courses screen into the admin Content tab's Achievements sub-view. The
 * sync/sync-all behavior and the `/api/admin/achievements/sync` contract are
 * UNCHANGED; only where this renders, and its chrome (AdminTableShell /
 * AdminButton instead of hand-rolled markup, en/es/pt-BR strings instead of
 * hardcoded English — #452) moved.
 */
export function AchievementSyncTable({
  achievements,
  onRefresh,
  courseTitleById = {},
  pathTitleById = {},
}: AchievementSyncTableProps) {
  const t = useTranslations("admin.contentScreen.achievements");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync(achievementId: string) {
    setSyncing(achievementId);
    setError(null);
    try {
      const res = await fetch("/api/admin/achievements/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? t("errors.sync"));
      } else {
        onRefresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.sync"));
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
      setSyncing(ach.contentId);
      try {
        const res = await fetch("/api/admin/achievements/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ achievementId: ach.contentId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? t("errors.syncFor", { name: ach.name }));
          onRefresh();
          break;
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : t("errors.syncFor", { name: ach.name })
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
        <div
          role="alert"
          className="mb-3 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
      {syncableCount > 0 && (
        <div className="mb-3 flex justify-end">
          <AdminButton
            variant="neutral"
            onClick={() => void handleSyncAll()}
            disabled={syncingAll}
          >
            {syncingAll
              ? t("actions.syncAllBusy")
              : t("actions.syncAll", { count: syncableCount })}
          </AdminButton>
        </div>
      )}
      <AdminTableShell
        columns={[
          { key: "achievement", label: t("table.achievement") },
          { key: "status", label: t("table.status") },
          { key: "collection", label: t("table.collection") },
          { key: "action", label: t("table.action"), align: "right" },
        ]}
      >
        {achievements.map((ach) => {
          const isSyncing = syncing === ach.contentId;
          const canDeploy =
            ach.onChainStatus === "not_deployed" &&
            ach.missingFields.length === 0;
          const needsCollectionRecovery =
            ach.onChainStatus === "synced" && !ach.collectionAddress;

          return (
            <tr
              key={ach.contentId}
              className="transition-colors hover:bg-subtle"
            >
              <td className="py-3 pr-4 align-top">
                <div className="font-medium text-text">{ach.name}</div>
                {ach.missingFields.length > 0 && (
                  <div className="mt-1 text-xs text-streak">
                    {t("missingFields", {
                      fields: ach.missingFields.join(", "),
                    })}
                  </div>
                )}
                <AwardRefLine
                  award={ach.award}
                  courseTitleById={courseTitleById}
                  pathTitleById={pathTitleById}
                />
              </td>
              <td className="py-3 pr-4 align-top">
                <StatusBadge status={ach.onChainStatus} />
              </td>
              <td className="py-3 pr-4 align-top font-mono text-xs text-text-3">
                {ach.collectionAddress
                  ? `${ach.collectionAddress.slice(0, 8)}...${ach.collectionAddress.slice(-4)}`
                  : "—"}
              </td>
              <td className="py-3 text-right align-top">
                {(canDeploy || needsCollectionRecovery) && (
                  <AdminButton
                    variant="primary"
                    onClick={() => void handleSync(ach.contentId)}
                    disabled={isSyncing}
                  >
                    {isSyncing
                      ? t("actions.working")
                      : needsCollectionRecovery
                        ? t("actions.sync")
                        : t("actions.deploy")}
                  </AdminButton>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
