"use client";

import { useTranslations } from "next-intl";
import { useAdminStatus } from "../use-admin-status";
import { CourseSyncTable } from "@/components/admin/course-sync-table";
import { AchievementSyncTable } from "@/components/admin/achievement-sync-table";
import { AdminCard } from "@/components/admin/admin-card";

/**
 * The deploy half of `/admin/courses` (step 2): the Courses + Achievements
 * sync tables. Unchanged from the retired `/admin/deploy` screen apart from
 * this move — the `/api/admin/status` fetch + loading/error/refetch live in
 * the shared `useAdminStatus` hook (SP3-D), which the status screen uses too.
 */
export function DeployClient() {
  const t = useTranslations("admin");
  const { status, loading, error, refetch } = useAdminStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-3">{t("states.loading")}</div>
      </div>
    );
  }

  if (error) {
    // A failed status fetch is transient/recoverable — neutral `streak`, not the
    // blocking `danger` red.
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

  return (
    <div className="space-y-8">
      {/* Courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-text">
            {t("deployScreen.coursesHeading")}
          </h3>
          <button
            onClick={refetch}
            className="rounded-md border border-border bg-card px-3 py-1 text-xs text-text-2 shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active"
          >
            {t("states.refresh")}
          </button>
        </div>
        <AdminCard>
          {courses.length === 0 ? (
            <p className="text-sm text-text-3">{t("deployScreen.noCourses")}</p>
          ) : (
            <CourseSyncTable courses={courses} onRefresh={refetch} />
          )}
        </AdminCard>
      </section>

      {/* Achievements */}
      <section>
        <h3 className="mb-4 font-display text-lg font-bold text-text">
          {t("deployScreen.achievementsHeading")}
        </h3>
        <AdminCard>
          {achievements.length === 0 ? (
            <p className="text-sm text-text-3">
              {t("deployScreen.noAchievements")}
            </p>
          ) : (
            <AchievementSyncTable
              achievements={achievements}
              onRefresh={refetch}
            />
          )}
        </AdminCard>
      </section>
    </div>
  );
}
