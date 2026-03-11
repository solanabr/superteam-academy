"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";
import { SyncDiffView } from "./sync-diff-view";
import { ImmutableMismatchWarning } from "./immutable-mismatch-warning";

interface DiffEntry {
  field: string;
  sanityValue: unknown;
  onChainValue: unknown;
  updateable: boolean;
}

interface CourseStatus {
  sanityId: string;
  slug: string;
  title: string;
  isDraft: boolean;
  lessonCount: number;
  sanityXpPerLesson: number | null;
  missingFields: string[];
  onChainStatus:
    | "synced"
    | "out_of_sync"
    | "not_deployed"
    | "draft"
    | "missing_fields";
  coursePda: string | null;
  differences: DiffEntry[];
}

interface CourseSyncTableProps {
  courses: CourseStatus[];
  adminToken: string;
  onRefresh: () => void;
}

export function CourseSyncTable({
  courses,
  adminToken,
  onRefresh,
}: CourseSyncTableProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync(courseId: string) {
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ courseId }),
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

  async function handleDeactivate(courseId: string) {
    if (
      !confirm(
        "Deactivate this course? Students cannot enroll until reactivated."
      )
    )
      return;
    setSyncing(courseId);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Deactivation failed");
      } else {
        onRefresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSyncing(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    setError(null);
    const syncable = courses.filter(
      (c) =>
        !c.isDraft &&
        c.missingFields.length === 0 &&
        !c.differences.some((d) => !d.updateable)
    );
    for (const course of syncable) {
      setSyncing(course.sanityId);
      try {
        const res = await fetch("/api/admin/courses/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ courseId: course.sanityId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? `Sync failed for ${course.title}`);
          onRefresh();
          break;
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : `Sync failed for ${course.title}`
        );
        onRefresh();
        break;
      }
    }
    setSyncing(null);
    setSyncingAll(false);
    onRefresh();
  }

  const syncableCount = courses.filter(
    (c) =>
      !c.isDraft &&
      c.missingFields.length === 0 &&
      !c.differences.some((d) => !d.updateable)
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
            <th className="pb-2 pr-4 font-medium">Course</th>
            <th className="pb-2 pr-4 text-center font-medium">Lessons</th>
            <th className="pb-2 pr-4 text-center font-medium">XP/Lesson</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map((course) => {
            const isSyncing = syncing === course.sanityId;
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
                key={course.sanityId}
                className="transition-colors hover:bg-subtle"
              >
                <td className="py-3 pr-4">
                  <div className="font-medium text-text">{course.title}</div>
                  <div className="mt-0.5 font-mono text-xs text-text-3">
                    {course.slug}
                  </div>
                  {course.missingFields.length > 0 && (
                    <div className="mt-1 text-xs text-streak">
                      Missing: {course.missingFields.join(", ")}
                    </div>
                  )}
                  {course.differences.length > 0 && (
                    <SyncDiffView
                      differences={course.differences}
                      title={course.title}
                    />
                  )}
                  {hasImmutableMismatch && (
                    <ImmutableMismatchWarning
                      immutableDiffs={immutableDiffs}
                      courseTitle={course.title}
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
                  {course.sanityXpPerLesson ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={course.onChainStatus} />
                </td>
                <td className="py-3">
                  {canSync && (
                    <button
                      onClick={() => void handleSync(course.sanityId)}
                      disabled={isSyncing}
                      className="rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncing ? "..." : actionLabel}
                    </button>
                  )}
                  {course.onChainStatus === "synced" && (
                    <button
                      onClick={() => void handleDeactivate(course.sanityId)}
                      disabled={isSyncing}
                      className="ml-2 rounded-md border border-border px-3 py-1 font-display text-xs font-bold text-text-2 shadow-push-sm transition-all hover:border-danger hover:bg-danger-light hover:text-danger active:translate-y-[2px] active:shadow-push-active disabled:opacity-50"
                    >
                      {isSyncing ? "..." : "Deactivate"}
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
