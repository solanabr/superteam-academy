"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { AdminStatus } from "../admin-status-types";
import { DataResyncPanel } from "@/components/admin/data-resync-panel";

/**
 * `/admin/status` client (SP3-A Task 3): the inline program-status bar
 * relocated VERBATIM from the deleted stacked `admin-client.tsx` (spec rev-2
 * mandate), plus `<DataResyncPanel/>` and the deploy counts. Same
 * `/api/admin/status` fetch and loading/error/refetch semantics.
 */
export function StatusClient() {
  const t = useTranslations("admin");
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

      {/* Deploy counts */}
      <div
        data-testid="deploy-counts"
        className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm shadow-card"
      >
        <span className="text-text-3">{t("counts.courses")}:</span>
        <span className="text-text">{courses.length}</span>
        <span className="text-border">|</span>
        <span className="text-text-3">{t("counts.achievements")}:</span>
        <span className="text-text">{achievements.length}</span>
      </div>

      {/* Data Resync */}
      <section>
        <h3 className="mb-4 font-display text-lg font-bold text-text">
          Data Resync
        </h3>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <DataResyncPanel />
        </div>
      </section>
    </div>
  );
}
