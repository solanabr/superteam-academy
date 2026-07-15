"use client";

import { useTranslations } from "next-intl";
import { useAdminStatus } from "../use-admin-status";
import { CourseSyncTable } from "@/components/admin/course-sync-table";
import { AdminCard } from "@/components/admin/admin-card";

/**
 * The deploy half of `/admin/courses` (step 2): the Courses sync table.
 * Unchanged from the retired `/admin/deploy` screen apart from this move — the
 * `/api/admin/status` fetch + loading/error/refetch live in the shared
 * `useAdminStatus` hook (SP3-D), which the status screen uses too.
 *
 * The Achievements sync table used to render as a second section here; #513
 * WS-C relocated it into the new Content tab's Achievements sub-view
 * (`admin/content/achievements-subview.tsx`), which reuses this same
 * `useAdminStatus()` hook — same data, same sync behavior, different screen.
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

  const { courses } = status;

  return (
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
  );
}
