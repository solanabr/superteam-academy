"use client";

import { useState } from "react";

/** One course awaiting admin review (mirrors the API `pendingReviews` shape). */
export interface PendingReviewCourse {
  _id: string;
  title: string;
  slug: string | null;
  difficulty: string | null;
  author: string | null;
  authoringStatus: string;
}

interface CourseReviewQueueProps {
  courses: PendingReviewCourse[];
  onRefresh: () => void;
}

/** Per-row result surfaced after an approve (incl. the chained on-chain sync). */
interface RowResult {
  kind: "success" | "error";
  message: string;
}

interface ReviewResponse {
  status?: string;
  error?: string;
}

interface SyncResponse {
  action?: "created" | "updated" | "noop";
  message?: string;
  warning?: string;
  error?: string;
}

export function CourseReviewQueue({
  courses,
  onRefresh,
}: CourseReviewQueueProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RowResult>>({});

  function setRowResult(courseId: string, result: RowResult) {
    setResults((prev) => ({ ...prev, [courseId]: result }));
  }

  // Approve → set status approved, THEN run the existing on-chain sync so the
  // course deploys + becomes public. The sync is the same endpoint the sync
  // table uses; we do NOT reimplement it here.
  async function handleApprove(courseId: string) {
    setBusy(courseId);
    setResults((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    try {
      const reviewRes = await fetch("/api/admin/courses/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, action: "approve" }),
      });
      if (!reviewRes.ok) {
        const data = (await reviewRes.json()) as ReviewResponse;
        setRowResult(courseId, {
          kind: "error",
          message: data.error ?? "Approval failed",
        });
        return;
      }

      // Status is now "approved"; deploy on-chain via the existing sync flow.
      const syncRes = await fetch("/api/admin/courses/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const syncData = (await syncRes.json()) as SyncResponse;
      if (!syncRes.ok) {
        setRowResult(courseId, {
          kind: "error",
          message: `Approved, but on-chain sync failed: ${
            syncData.error ?? "unknown error"
          }. Re-sync from the Courses table.`,
        });
        return;
      }

      const actionLabel =
        syncData.action === "created"
          ? "deployed on-chain"
          : syncData.action === "updated"
            ? "updated on-chain"
            : "already synced";
      setRowResult(courseId, {
        kind: "success",
        message: syncData.warning
          ? `Approved and ${actionLabel}. Warning: ${syncData.warning}`
          : `Approved and ${actionLabel}.`,
      });
    } catch (e) {
      setRowResult(courseId, {
        kind: "error",
        message: e instanceof Error ? e.message : "Approval failed",
      });
    } finally {
      setBusy(null);
      // Refresh so the approved course leaves the queue.
      onRefresh();
    }
  }

  // Reject → prompt for feedback, then return the course to draft with the note.
  async function handleReject(courseId: string) {
    const feedback = prompt(
      "Rejection feedback for the teacher (required):"
    )?.trim();
    if (!feedback) return;

    setBusy(courseId);
    setResults((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    try {
      const res = await fetch("/api/admin/courses/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, action: "reject", feedback }),
      });
      if (!res.ok) {
        const data = (await res.json()) as ReviewResponse;
        setRowResult(courseId, {
          kind: "error",
          message: data.error ?? "Rejection failed",
        });
        return;
      }
      setRowResult(courseId, {
        kind: "success",
        message: "Rejected — returned to draft with feedback.",
      });
    } catch (e) {
      setRowResult(courseId, {
        kind: "error",
        message: e instanceof Error ? e.message : "Rejection failed",
      });
    } finally {
      setBusy(null);
      onRefresh();
    }
  }

  if (courses.length === 0) {
    return <p className="text-sm text-text-3">No courses awaiting review.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-3">
          <th className="pb-2 pr-4 font-medium">Course</th>
          <th className="pb-2 pr-4 font-medium">Difficulty</th>
          <th className="pb-2 font-medium">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {courses.map((course) => {
          const isBusy = busy === course._id;
          const result = results[course._id];
          return (
            <tr key={course._id} className="transition-colors hover:bg-subtle">
              <td className="py-3 pr-4">
                <div className="font-medium text-text">{course.title}</div>
                {course.slug && (
                  <div className="mt-0.5 font-mono text-xs text-text-3">
                    {course.slug}
                  </div>
                )}
                {course.author && (
                  <div className="mt-0.5 font-mono text-[10px] text-text-3">
                    author: {course.author}
                  </div>
                )}
                {result && (
                  <div
                    className={`mt-1 text-xs ${
                      result.kind === "error" ? "text-danger" : "text-success"
                    }`}
                  >
                    {result.message}
                  </div>
                )}
              </td>
              <td className="py-3 pr-4 capitalize text-text">
                {course.difficulty ?? "—"}
              </td>
              <td className="py-3">
                <button
                  onClick={() => void handleApprove(course._id)}
                  disabled={isBusy}
                  className="rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => void handleReject(course._id)}
                  disabled={isBusy}
                  className="ml-2 rounded-md border border-border px-3 py-1 font-display text-xs font-bold text-text-2 shadow-push-sm transition-all hover:border-danger hover:bg-danger-light hover:text-danger active:translate-y-[2px] active:shadow-push-active disabled:opacity-50"
                >
                  {isBusy ? "..." : "Reject"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
