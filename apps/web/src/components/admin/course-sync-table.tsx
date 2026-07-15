"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StatusBadge, ContentDriftBadge } from "./status-badge";
import { SyncDiffView } from "./sync-diff-view";
import { RecreateCourseFlow } from "./recreate-course-flow";
import { DeployChangePreview } from "./deploy-change-preview";
import type { CourseStatus } from "@/app/[locale]/admin/admin-status-types";

interface CourseSyncTableProps {
  courses: CourseStatus[];
  onRefresh: () => void;
}

/** Deploy/redeploy candidates: not draft, complete, no immutable mismatch. */
function syncableCourses(courses: CourseStatus[]): CourseStatus[] {
  return courses.filter(
    (c) =>
      !c.isDraft &&
      c.missingFields.length === 0 &&
      !c.differences.some((d) => !d.updateable)
  );
}

export function CourseSyncTable({ courses, onRefresh }: CourseSyncTableProps) {
  const t = useTranslations("admin.deployScreen");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Course whose deploy/redeploy is pending confirmation in the change preview
  // (SP3-C Task 2: per-row deploy opens the preview instead of firing).
  const [previewCourse, setPreviewCourse] = useState<CourseStatus | null>(null);

  // Route errors carry cleanly-worded refusals (e.g. the #402 denylist / #400
  // on-curve messages, pubkey included) — surface them verbatim under a
  // localized label instead of raw, with a localized fallback when the route
  // gave no message.
  function actionError(message: string | undefined, fallbackKey: string): void {
    setError(
      message ? t("errors.action", { message }) : t(`errors.${fallbackKey}`)
    );
  }

  async function handleSync(courseId: string) {
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        actionError(data.error, "sync");
      } else {
        onRefresh();
      }
    } catch (e) {
      actionError(e instanceof Error ? e.message : undefined, "sync");
    } finally {
      setSyncing(null);
    }
  }

  async function handleDeactivate(courseId: string) {
    if (!confirm(t("deactivateConfirm"))) return;
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        actionError(data.error, "deactivate");
      } else {
        onRefresh();
      }
    } catch (e) {
      actionError(e instanceof Error ? e.message : undefined, "deactivate");
    } finally {
      setSyncing(null);
    }
  }

  async function handleReactivate(courseId: string) {
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        actionError(data.error, "reactivate");
      } else {
        onRefresh();
      }
    } catch (e) {
      actionError(e instanceof Error ? e.message : undefined, "reactivate");
    } finally {
      setSyncing(null);
    }
  }

  async function handleSyncAll() {
    const syncable = syncableCourses(courses);
    // One-line bulk confirm ("Sync N courses — M field changes"), not N modals.
    const changes = syncable.reduce((n, c) => n + c.differences.length, 0);
    if (!confirm(t("syncAllConfirm", { count: syncable.length, changes }))) {
      return;
    }
    setSyncingAll(true);
    setError(null);
    for (const course of syncable) {
      setSyncing(course.contentId);
      try {
        const res = await fetch("/api/admin/courses/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.contentId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(
            data.error
              ? t("errors.action", { message: data.error })
              : t("errors.syncFor", { title: course.title })
          );
          onRefresh();
          break;
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? t("errors.action", { message: e.message })
            : t("errors.syncFor", { title: course.title })
        );
        onRefresh();
        break;
      }
    }
    setSyncing(null);
    setSyncingAll(false);
    onRefresh();
  }

  const syncableCount = syncableCourses(courses).length;

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
            <th className="pb-2 pr-4 font-medium">Course</th>
            <th className="pb-2 pr-4 text-center font-medium">Lessons</th>
            <th className="pb-2 pr-4 text-center font-medium">XP/Lesson</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map((course) => {
            const isSyncing = syncing === course.contentId;
            const immutableDiffs = course.differences.filter(
              (d) => !d.updateable
            );
            const hasImmutableMismatch = immutableDiffs.length > 0;
            const canSync =
              !course.isDraft &&
              course.missingFields.length === 0 &&
              !hasImmutableMismatch;
            const actionLabel =
              course.onChainStatus === "not_deployed" ? "Deploy" : "Sync";

            return (
              <tr
                key={course.contentId}
                className="transition-colors hover:bg-subtle"
              >
                <td className="py-3 pr-4">
                  <div className="font-medium text-text">{course.title}</div>
                  <div className="mt-0.5 font-mono text-xs text-text-3">
                    {course.slug}
                  </div>
                  {course.missingFields.length > 0 && (
                    <div className="mt-1 text-xs text-streak">
                      {t("missingFields", {
                        fields: course.missingFields.join(", "),
                      })}
                    </div>
                  )}
                  {course.differences.length > 0 && (
                    <SyncDiffView
                      differences={course.differences}
                      title={course.title}
                    />
                  )}
                  {hasImmutableMismatch && (
                    <RecreateCourseFlow
                      courseId={course.contentId}
                      courseTitle={course.title}
                      immutableDiffs={immutableDiffs}
                      onRecreated={onRefresh}
                    />
                  )}
                </td>
                <td className="py-3 pr-4 text-center text-text">
                  {course.lessonCount === 0 ? (
                    <span className="text-streak">—</span>
                  ) : (
                    course.lessonCount
                  )}
                </td>
                <td className="py-3 pr-4 text-center text-text">
                  {course.contentXpPerLesson ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={course.onChainStatus} />
                    <ContentDriftBadge
                      onChainStatus={course.onChainStatus}
                      contentDrift={course.contentDrift}
                    />
                    {course.onChainStatus === "synced" &&
                      course.isActive === false && (
                        <span className="inline-flex items-center rounded border border-danger bg-danger-light px-2 py-0.5 text-xs font-medium text-danger">
                          Deactivated
                        </span>
                      )}
                  </div>
                </td>
                <td className="py-3">
                  {canSync && (
                    <button
                      onClick={() => setPreviewCourse(course)}
                      disabled={isSyncing}
                      className="rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncing ? "..." : actionLabel}
                    </button>
                  )}
                  {course.onChainStatus === "synced" &&
                    (course.isActive === false ? (
                      <button
                        onClick={() => void handleReactivate(course.contentId)}
                        disabled={isSyncing}
                        className="ml-2 rounded-md border border-success px-3 py-1 font-display text-xs font-bold text-success shadow-push-sm transition-all hover:bg-success-light active:translate-y-[2px] active:shadow-push-active disabled:opacity-50"
                      >
                        {isSyncing ? "..." : "Reactivate"}
                      </button>
                    ) : (
                      <button
                        onClick={() => void handleDeactivate(course.contentId)}
                        disabled={isSyncing}
                        className="ml-2 rounded-md border border-border px-3 py-1 font-display text-xs font-bold text-text-2 shadow-push-sm transition-all hover:border-danger hover:bg-danger-light hover:text-danger active:translate-y-[2px] active:shadow-push-active disabled:opacity-50"
                      >
                        {isSyncing ? "..." : "Deactivate"}
                      </button>
                    ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {previewCourse && (
        <DeployChangePreview
          course={previewCourse}
          onConfirm={() => {
            const id = previewCourse.contentId;
            setPreviewCourse(null);
            void handleSync(id);
          }}
          onCancel={() => setPreviewCourse(null)}
        />
      )}
    </div>
  );
}
