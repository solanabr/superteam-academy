"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminStatus } from "../admin-status-types";
import { CourseSyncTable } from "@/components/admin/course-sync-table";
import { AchievementSyncTable } from "@/components/admin/achievement-sync-table";

/**
 * `/admin/deploy` client: the Courses + Achievements sync tables relocated
 * verbatim from the deleted stacked `admin-client.tsx` (SP3-A Task 3), with
 * the same `/api/admin/status` fetch, loading/error/refetch semantics, and
 * `onRefresh` wiring.
 */
export function DeployClient() {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Authorized via the httpOnly admin_session cookie (sent automatically).
      const res = await fetch("/api/admin/status");
      if (!res.ok) {
        setError("Failed to fetch status");
        return;
      }
      const data = (await res.json()) as AdminStatus;
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-3">Loading on-chain status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-danger bg-danger-light p-4 text-sm text-danger">
        {error}
        <button
          onClick={() => void fetchStatus()}
          className="ml-3 underline hover:no-underline"
        >
          Retry
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
          <h3 className="font-display text-lg font-bold text-text">Courses</h3>
          <button
            onClick={() => void fetchStatus()}
            className="rounded-md border border-border bg-card px-3 py-1 text-xs text-text-2 shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active"
          >
            Refresh
          </button>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          {courses.length === 0 ? (
            <p className="text-sm text-text-3">No courses found in Sanity.</p>
          ) : (
            <CourseSyncTable
              courses={courses}
              onRefresh={() => void fetchStatus()}
            />
          )}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h3 className="mb-4 font-display text-lg font-bold text-text">
          Achievements
        </h3>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          {achievements.length === 0 ? (
            <p className="text-sm text-text-3">
              No achievements found in Sanity.
            </p>
          ) : (
            <AchievementSyncTable
              achievements={achievements}
              onRefresh={() => void fetchStatus()}
            />
          )}
        </div>
      </section>
    </div>
  );
}
