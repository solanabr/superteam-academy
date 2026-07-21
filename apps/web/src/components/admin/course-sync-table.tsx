"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StatusBadge, ContentDriftBadge } from "./status-badge";
import { SyncDiffView } from "./sync-diff-view";
import { RecreateCourseFlow } from "./recreate-course-flow";
import { DeployChangePreview } from "./deploy-change-preview";
import { AdminTableShell } from "./admin-table-shell";
import { AdminButton } from "./admin-button";
import { AdminBadge } from "./admin-badge";
import { AdminDisclosure } from "./admin-disclosure";
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

  // §11.0: write the on-chain content commitment (content_tx_id) so a
  // `content_stale` course goes current. Posts `commitContent` alone — the route
  // derives the active_lessons mask from the committed slots.lock.json. Separate
  // from the field-sync/redeploy above, which never moves the commitment.
  async function handleCommitContent(courseId: string) {
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, commitContent: true }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        actionError(data.error, "commitContent");
      } else {
        onRefresh();
      }
    } catch (e) {
      actionError(e instanceof Error ? e.message : undefined, "commitContent");
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
      {/* Transient action errors get the neutral `streak` treatment, not
          `danger` — `danger` is reserved for the blocking immutable mismatch and
          the destructive recreate. */}
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-streak bg-streak-light p-3 text-sm text-streak"
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
          { key: "course", label: t("table.course"), headClassName: "pr-4" },
          {
            key: "lessons",
            label: t("table.lessons"),
            align: "center",
            headClassName: "pr-4",
          },
          {
            key: "xpPerLesson",
            label: t("table.xpPerLesson"),
            align: "center",
            headClassName: "pr-4",
          },
          { key: "status", label: t("table.status"), headClassName: "pr-4" },
          {
            key: "action",
            label: t("table.action"),
            align: "right",
            headClassName: "w-44",
          },
        ]}
      >
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
            course.onChainStatus === "not_deployed"
              ? t("actions.deploy")
              : t("actions.sync");

          return (
            <tr
              key={course.contentId}
              className="transition-colors hover:bg-subtle"
            >
              {/* align-top keeps every cell's eyeline steady when a tall
                  mismatch/diff row expands the Course cell. */}
              <td className="py-3 pr-4 align-top">
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
                  // Collapse the row-exploding recreate card to a one-line danger
                  // pill; the disclosure reveals the SAME `RecreateCourseFlow`
                  // card unchanged (its preflight/execute/refusal logic is
                  // frozen — this is pure presentation).
                  <AdminDisclosure
                    triggerClassName="mt-2 rounded-full border border-danger bg-danger-light px-2.5 py-1 text-xs font-semibold text-danger"
                    summary={t("recreate.summaryPill", {
                      count: immutableDiffs.length,
                    })}
                  >
                    <RecreateCourseFlow
                      courseId={course.contentId}
                      courseTitle={course.title}
                      immutableDiffs={immutableDiffs}
                      onRecreated={onRefresh}
                    />
                  </AdminDisclosure>
                )}
              </td>
              <td className="py-3 pr-4 text-center align-top text-text">
                {course.lessonCount === 0 ? (
                  <span className="text-streak">—</span>
                ) : (
                  course.lessonCount
                )}
              </td>
              <td className="py-3 pr-4 text-center align-top text-text">
                {course.contentXpPerLesson ?? "—"}
              </td>
              <td className="py-3 pr-4 align-top">
                {/* min-w reserves the badge column so wrapping there never
                    ripples the Course/Action columns' widths. */}
                <div className="flex min-w-[7.5rem] flex-wrap items-center gap-1.5">
                  <StatusBadge status={course.onChainStatus} />
                  <ContentDriftBadge
                    onChainStatus={course.onChainStatus}
                    contentDrift={course.contentDrift}
                  />
                  {course.onChainStatus === "synced" &&
                    course.isActive === false && (
                      <AdminBadge tone="danger">{t("deactivated")}</AdminBadge>
                    )}
                </div>
              </td>
              <td className="py-3 text-right align-top">
                <div className="flex justify-end gap-2">
                  {canSync && (
                    <AdminButton
                      variant="primary"
                      onClick={() => setPreviewCourse(course)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? t("actions.working") : actionLabel}
                    </AdminButton>
                  )}
                  {/* On-chain content commitment (content_tx_id) is written by a
                      dedicated action, never by the field deploy/redeploy above
                      (which posts `{ courseId }` alone). Shown only while the
                      course is deployed-but-stale. */}
                  {course.chainDrift === "content_stale" && (
                    <AdminButton
                      variant="neutral"
                      onClick={() => void handleCommitContent(course.contentId)}
                      disabled={isSyncing}
                    >
                      {isSyncing
                        ? t("actions.working")
                        : t("actions.commitContent")}
                    </AdminButton>
                  )}
                  {course.onChainStatus === "synced" &&
                    (course.isActive === false ? (
                      <AdminButton
                        variant="neutral"
                        onClick={() => void handleReactivate(course.contentId)}
                        disabled={isSyncing}
                      >
                        {isSyncing
                          ? t("actions.working")
                          : t("actions.reactivate")}
                      </AdminButton>
                    ) : (
                      <AdminButton
                        variant="neutral"
                        onClick={() => void handleDeactivate(course.contentId)}
                        disabled={isSyncing}
                      >
                        {isSyncing
                          ? t("actions.working")
                          : t("actions.deactivate")}
                      </AdminButton>
                    ))}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTableShell>
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
