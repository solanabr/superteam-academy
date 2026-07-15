"use client";

import { useTranslations } from "next-intl";
import { useAdminStatus } from "../use-admin-status";
import { AchievementSyncTable } from "@/components/admin/achievement-sync-table";
import { AdminCard } from "@/components/admin/admin-card";

interface AchievementsSubviewProps {
  /** `award.path` id → title, server-computed from `getLearningPathsForAdminWithRefs` (#513). */
  pathTitleById: Record<string, string>;
}

/**
 * The Achievements sub-view of the Content tab (#513 WS-C) — relocated from
 * the Courses screen's second section (`courses/deploy-client.tsx`). Reuses
 * `useAdminStatus()`, the SAME hook `DeployClient` uses, so the sync/sync-all
 * behavior and the `/api/admin/achievements/sync` contract are unchanged; only
 * where this renders moved. `courseTitleById` comes for free from the same
 * response's `courses` array (no extra request) so the table can optionally
 * resolve an achievement's `award.course` ref.
 */
export function AchievementsSubview({
  pathTitleById,
}: AchievementsSubviewProps) {
  const t = useTranslations("admin");
  const tAch = useTranslations("admin.contentScreen.achievements");
  const { status, loading, error, refetch } = useAdminStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-3">{t("states.loading")}</div>
      </div>
    );
  }

  if (error) {
    // A failed status fetch is transient/recoverable — neutral `streak`, not
    // the blocking `danger` red (same convention as DeployClient).
    return (
      <div
        role="alert"
        className="rounded-md border border-streak bg-streak-light p-4 text-sm text-streak"
      >
        {t(error === "network" ? "states.networkError" : "states.fetchError")}
        <button onClick={refetch} className="ml-3 underline hover:no-underline">
          {t("states.retry")}
        </button>
      </div>
    );
  }

  if (!status) return null;

  const { courses, achievements } = status;
  const courseTitleById = Object.fromEntries(
    courses.map((c) => [c.contentId, c.title])
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-text">
          {tAch("heading")}
        </h3>
        <button
          onClick={refetch}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs text-text-2 shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active"
        >
          {t("states.refresh")}
        </button>
      </div>
      <AdminCard>
        {achievements.length === 0 ? (
          <p className="text-sm text-text-3">{tAch("empty")}</p>
        ) : (
          <AchievementSyncTable
            achievements={achievements}
            onRefresh={refetch}
            courseTitleById={courseTitleById}
            pathTitleById={pathTitleById}
          />
        )}
      </AdminCard>
    </section>
  );
}
