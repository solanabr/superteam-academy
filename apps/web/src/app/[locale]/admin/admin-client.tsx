"use client";

import { useState, useEffect, useCallback } from "react";
import { CourseSyncTable } from "@/components/admin/course-sync-table";
import { AchievementSyncTable } from "@/components/admin/achievement-sync-table";
import { DataResyncPanel } from "@/components/admin/data-resync-panel";

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

interface AchievementStatus {
  sanityId: string;
  name: string;
  missingFields: string[];
  onChainStatus: "synced" | "not_deployed" | "missing_fields" | "draft";
  achievementPda: string | null;
  collectionAddress: string | null;
}

interface AdminStatus {
  program: {
    deployed: boolean;
    programId: string;
    configPda: string | null;
    minterRegistered: boolean;
    authorityMatch: {
      matches: boolean;
      configAuthority?: string;
      localKey?: string;
    };
  };
  courses: CourseStatus[];
  achievements: AchievementStatus[];
}

interface AdminClientProps {
  adminToken: string;
}

export function AdminClient({ adminToken }: AdminClientProps) {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/status", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
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
  }, [adminToken]);

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

  const { program, courses, achievements } = status;

  return (
    <div className="space-y-8">
      {/* Program status bar */}
      <div className="rounded-lg border border-border bg-card p-4 text-sm shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-text-3">Network:</span>
          <span className="text-text">devnet</span>
          <span className="text-border">|</span>
          <span className="text-text-3">Program:</span>
          <span className="font-mono text-xs text-text">
            {program.programId.slice(0, 8)}...{program.programId.slice(-4)}
          </span>
          <span className="text-border">|</span>
          <span className="text-text-3">Config:</span>
          {program.deployed ? (
            <span className="text-success">Found</span>
          ) : (
            <span className="text-danger">Not initialized</span>
          )}
          {!program.authorityMatch.matches && (
            <span className="ml-2 text-xs text-accent">
              Authority mismatch — check PROGRAM_AUTHORITY_SECRET
            </span>
          )}
        </div>
      </div>

      {/* Courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-text">Courses</h2>
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
              adminToken={adminToken}
              onRefresh={() => void fetchStatus()}
            />
          )}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-text">
          Achievements
        </h2>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          {achievements.length === 0 ? (
            <p className="text-sm text-text-3">
              No achievements found in Sanity.
            </p>
          ) : (
            <AchievementSyncTable
              achievements={achievements}
              adminToken={adminToken}
              onRefresh={() => void fetchStatus()}
            />
          )}
        </div>
      </section>

      {/* Data Resync */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-text">
          Data Resync
        </h2>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <DataResyncPanel adminToken={adminToken} />
        </div>
      </section>
    </div>
  );
}
